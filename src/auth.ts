import { cache } from "react";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import Google from "next-auth/providers/google";
import { isAdminEmail } from "@/lib/admin";
import "@/types/next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: { prompt: "select_account" },
      },
    }),
  ],
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token }) {
      token.isAdmin = isAdminEmail(token.email);
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.isAdmin = token.isAdmin === true;
      }
      return session;
    },
  },
};

export function googleAuthConfigured(): boolean {
  return Boolean(
    process.env.AUTH_SECRET &&
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET,
  );
}

/** Relative in-app paths only, so the post-login redirect cannot leave the site. */
export function safeCallbackUrl(
  value: string | string[] | undefined,
  fallback = "/admin",
): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (
    !raw ||
    !raw.startsWith("/") ||
    raw.startsWith("//") ||
    raw.startsWith("/login") ||
    raw.startsWith("/api")
  ) {
    return fallback;
  }
  return raw;
}

export const getAuthSession = cache(async () => {
  if (!process.env.AUTH_SECRET) return null;
  return getServerSession(authOptions);
});

export async function requireAdmin(): Promise<Response | null> {
  const session = await getAuthSession();
  if (!session?.user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!session.user.isAdmin) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  return null;
}
