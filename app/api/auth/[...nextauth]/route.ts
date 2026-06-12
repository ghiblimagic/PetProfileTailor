/**
 * NextAuth catch-all — export handler as GET + POST (special App Router case).
 * Notes: docs/notes/lib/auth.md § App Router [...nextauth] route
 */
import NextAuth from "next-auth";
import { serverAuthOptions } from "@/lib/auth";

const handler = NextAuth(serverAuthOptions);

export { handler as GET, handler as POST };
