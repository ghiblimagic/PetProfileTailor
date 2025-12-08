import bcryptjs from "bcryptjs";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import User from "@models/User";
// import NameTag from "../../../models/NameTag";
import db from "@utils/db";

import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "@/app/api/auth/lib/mongodb";

import { sendVerificationRequest } from "@/lib/send-verification-request";

export const serverAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24, // how long the JWT/session is valid (e.g., 24 hours)
    updateAge: 30 * 60, // refresh token after 30 minutes to catch banned users
    // Set to jwt in order for CredentialsProvider to work properly
    //https://next-auth.js.org/configuration/providers/credentials
    //https://github.com/nextauthjs/next-auth/issues/3970
  },
  callbacks: {
    //PASSWORD && EMAIL CALLS CREDENTIALS PROVIDER ==> SUBMIT button event ==>
    //   await signIn("credentials", ....)
    //aka think of it as "/api/auth/sigin/credentialsProvider"

    //MAGIC LINK CALLS EMAIL PROVIDER ==> SUBMIT BUTTON ==> FORM method="post" action="/api/auth/signin/email"

    async signIn({ user, account, profile, email, credentials }) {
      //https://next-auth.js.org/providers/email parameter names from https://next-auth.js.org/configuration/callbacks
      //checking if the email exists in the database, if it does, allow user to signin

      try {
        await db.connect();
        const userExists = await User.findOne({
          email: user.email, //the user object has an email property, which contains the email the user entered.
        });

        if (userExists && userExists.status === "banned") {
          // for magic link users that are banned
          return "/login?error=Banned";
        }

        //  MAGIC LINK (email provider)
        if (account.provider === "email") {
          // Always send them to the magiclink page
          // return true because NextAuth automatically redirects email-based sign-ins to the verifyRequest page anyway
          // magic links have to be absolute or true, because next.auth handles those link a special way using newURL() instead of res.redirect()
          // res.redirect understands relative redirect paths so "/login?error" works while "/magicLink" which internally uses a newUrl doesn't
          return true;
        }

        //  EMAIL + PASSWORD (credentials provider)
        if (account.provider === "credentials") {
          // only allow sign in if user exists
          if (userExists) return true;
          return "/login?error=UserNotFound";
        }
        // fallback
        return true;
      } catch (err) {
        console.error("Error in signIn callback:", err);

        // Optionally, redirect to a friendly error page
        return "/login?error=DBUnavailable";
      }
    },
    async jwt({ token, user, trigger, session }) {
      // Handle session.update() calls
      if (trigger === "update" && session?.user) {
        token.user = { ...token.user, ...session.user };
      }

      if (user) {
        token.user = {
          id: user.id || user._id,
          name: user.name,
          profileName: user.profileName,
          bio: user.bio || "",
          location: user.location || "",
          profileImage: user.profileImage,
          role: user.role,
          status: user.status,
        };
      } else if (token.user?.id) {
        // refresh from DB only if updateAge is reached
        try {
          await db.connect();
          const freshUser = await User.findById(token.user?.id).select(
            "status",
          );
          if (freshUser) {
            token.user.status = freshUser.status;
          } else {
            token.user = null; // user deleted
          }
        } catch (err) {
          console.error("JWT refresh error:", err);
        }
      }

      return token;
    },

    async session({ session, token }) {
      // session is always an object, token is always an object
      // token.user may or may not exist
      if (token.user) {
        // Only expose safe fields in session, aka what we listed above in the token
        session.user = token.user;
      }
      // session.user might still be undefined if token.user was missing
      if (!session.user) return null;

      return session;
    },
  },
  providers: [
    CredentialsProvider({
      // if email and password match, sign in
      async authorize(credentials) {
        await db.connect();
        const user = await User.findOne({
          email: credentials.email,
        });

        if (!user) throw new Error("Invalid email or password");

        if (user.status === "banned") {
          throw new Error("This account has been banned. Contact support.");
        }

        if (user && bcryptjs.compareSync(credentials.password, user.password)) {
          return {
            id: user._id,
            // use id that way it will be normalized with the magic login sign on, which creates user.session.id instead of user.session._id
            name: user.name,
            profileName: user.profileName,
            email: user.email,
            profileImage: user.profileImage,
            role: user.role,
            status: user.status,
          };
        }
        throw new Error("Invalid email or password");
      },
    }),
    EmailProvider({
      // this allows us to add to the email provider object
      // however some provider properties aren't editable here
      //for example the callbackurl for the magiclink login (the verifyRequest page), can't be changed here, you have to jump down to the pages section to overwrite next-auth's default callbackUrl to the verify reuqest page for email/magic link login
      // provider: {
      //   id: 'email',
      //   type: 'email',
      //   name: 'Email',
      //   server: { host: 'smtp.resend.com', port: '465', auth: [Object] },
      //   from: 'no-reply@tailoredpetnames.com',
      //   maxAge: 86400,
      //   sendVerificationRequest: [AsyncFunction: sendVerificationRequest],
      //   signinUrl: 'http://localhost:3000/api/auth/signin/email',
      //   callbackUrl: 'http://localhost:3000/api/auth/callback/email'
      // },

      //logic for the magic link,  database is required to create a magic link. I'm using mongoDB
      //this will send a verfication token to mongoDB in the verification_tokens collection AND to the email link the users given
      //server sets up our connection with resend, we use the env variables that resend gave us
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.RESEND_EMAIL_FROM,
      //sendVerificationRequest allows us to customize the magic link's email https://next-auth.js.org/providers/email#customising-emails, under the hood its using the nodemailer package
      sendVerificationRequest,
    }),
  ],
  //overwrite the default pages with personalize pages
  //https://next-auth.js.org/configuration/pages
  pages: {
    verifyRequest: "/magiclink",
  },
};
