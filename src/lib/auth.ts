import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { allowRequest } from "@/lib/request-limit";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        if (credentials.password.length > 1000 || !await allowRequest("login", credentials.email.trim().toLowerCase(), 10, 900)) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.trim().toLowerCase() }
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // 'user' is only defined strictly on the initial sign-in moment.
      // We query the database once here to guarantee OAuth and Credentials 
      // both instantly receive the exact live `role` and `studentCode`.
      if (user && user.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, role: true, studentCode: true, sessionVersion: true }
        });

        if (dbUser) {
          token.sessionVersion = dbUser.sessionVersion;
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.studentCode = dbUser.studentCode;
        } else {
          token.id = user.id;
          token.role = "STUDENT"; // Safe default
        }
      }
      
      if (!user && token.id) {
        const current = await prisma.user.findUnique({ where: { id: token.id as string }, select: { role: true, studentCode: true, sessionVersion: true } });
        if (!current || (token.sessionVersion ?? 0) !== current.sessionVersion) { token.id = ""; token.role = "REVOKED"; return token; }
        token.role = current.role;
        token.studentCode = current?.studentCode;
        if (!current) token.id = "";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        (session.user as any).studentCode = token.studentCode as string | null;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
