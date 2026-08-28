import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, getExpectedSessionToken } from "@/lib/auth";

export const config = {
  matcher: [
    /*
     * Protect everything except:
     * - /login (the password gate itself)
     * - /api/auth/* (login/logout endpoints)
     * - /api/cron/* (protected separately by CRON_SECRET)
     * - Next internals & static assets
     */
    "/((?!login|api/auth|api/cron|_next/static|_next/image|favicon.ico).*)",
  ],
};

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  let expected: string | null = null;
  try {
    expected = await getExpectedSessionToken();
  } catch {
    // AUTH_SECRET missing — fail closed, but avoid a crash loop by showing
    // the login page (which will surface a clear misconfiguration error).
  }

  if (expected && token === expected) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}
