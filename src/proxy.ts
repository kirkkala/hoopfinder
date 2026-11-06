import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { adminLoginPath, isAdminEmail } from "@/lib/admin";

export async function proxy(request: NextRequest) {
  const token = process.env.AUTH_SECRET
    ? await getToken({ req: request, secret: process.env.AUTH_SECRET })
    : null;
  const email = typeof token?.email === "string" ? token.email : null;
  if (isAdminEmail(email)) return NextResponse.next();

  const login = new URL(
    adminLoginPath(request.nextUrl.pathname, request.nextUrl.search),
    request.url,
  );
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
