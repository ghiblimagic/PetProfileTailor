import type { UserRole, UserStatus } from "@models/User";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    profileName?: string;
    profileImage?: string;
    bio?: string;
    location?: string;
    role?: UserRole;
    status?: UserStatus;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      profileName?: string;
      bio?: string;
      location?: string;
      profileImage?: string;
      role?: UserRole;
      status?: UserStatus;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user?: Session["user"] | null;
  }
}
