/**
 * Deep design notes: docs/notes/lib/auth.md
 */
import bcryptjs from "bcryptjs";
import type { AuthOptions, Session, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import UserModel, { type IUserDocument } from "@models/User";
import db from "@utils/db";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "@/app/api/auth/lib/mongodb";
import { sendVerificationRequest } from "@/lib/send-verification-request";
import { resolveSignInCallback } from "./resolveSignInCallback";

function toCredentialsUser(doc: IUserDocument): User {
  return {
    id: doc._id.toString(),
    name: doc.name,
    profileName: doc.profileName,
    email: doc.email,
    profileImage: doc.profileImage,
    role: doc.role,
    status: doc.status,
  };
}

function toTokenUser(user: User): Session["user"] {
  return {
    id: user.id,
    name: user.name,
    profileName: user.profileName,
    bio: user.bio,
    location: user.location,
    profileImage: user.profileImage,
    role: user.role,
    status: user.status,
  };
}

export { resolveSignInCallback } from "./resolveSignInCallback";

export const serverAuthOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24,
    updateAge: 30 * 60,
  },
  callbacks: {
    async signIn({ user, account }) {
      try {
        await db.connect();
        const userExists = await UserModel.findOne({ email: user.email });

        return resolveSignInCallback({
          userExists: userExists ? { status: userExists.status } : null,
          provider: account?.provider ?? "",
        });
      } catch (err) {
        console.error("Error in signIn callback:", err);
        return "/login?error=DBUnavailable";
      }
    },

    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session?.user) {
        token.user = { ...token.user, ...session.user };
      }

      if (user) {
        token.user = toTokenUser(user);
      } else if (token.user?.id) {
        try {
          await db.connect();
          const freshUser = await UserModel.findById(token.user.id).select(
            "status",
          );
          if (freshUser) {
            token.user.status = freshUser.status;
          } else {
            token.user = null;
          }
        } catch (err) {
          console.error("JWT refresh error:", err);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token.user) {
        session.user = token.user;
      }

      // Runtime: null invalidates session (see docs/notes/lib/auth.md). TS types omit null so we have to do this to satisfy the type system.
      if (!session.user) {
        return null as unknown as typeof session;
      }

      return session;
    },
  },
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (!email || !password) {
          throw new Error("Invalid email or password");
        }

        await db.connect();
        const user = await UserModel.findOne({ email });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        if (user.status === "banned") {
          throw new Error("This account has been banned. Contact support.");
        }

        const storedPassword = user.password;
        if (!storedPassword || !bcryptjs.compareSync(password, storedPassword)) {
          throw new Error("Invalid email or password");
        }

        return toCredentialsUser(user);
      },
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.RESEND_EMAIL_FROM,
      sendVerificationRequest,
    }),
  ],
  pages: {
    verifyRequest: "/magiclink",
  },
};
