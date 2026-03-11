import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@cri.kr" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Dummy dev check - In production, use bcrypt against a real hash
        if (credentials.email === "admin@cri.kr" && credentials.password === "admin") {
          return { id: "1", name: "Admin", email: "admin@cri.kr", role: "ADMIN" };
        }
        if (credentials.email === "parent@cri.kr" && credentials.password === "parent") {
          return { id: "2", name: "Parent", email: "parent@cri.kr", role: "PARENT" };
        }
        if (credentials.email === "student@cri.kr" && credentials.password === "student") {
          return { id: "3", name: "Student", email: "student@cri.kr", role: "STUDENT" };
        }

        // Try to find user in DB
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        // Basic plaintext check for dev purposes since we haven't set up hashing
        if (user && user.password === credentials.password) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          };
        }

        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
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
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
