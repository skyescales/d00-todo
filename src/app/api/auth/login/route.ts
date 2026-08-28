import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, checkPassword, getExpectedSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!process.env.APP_PASSWORD || !process.env.AUTH_SECRET) {
    return NextResponse.json(
      { error: "Server is missing APP_PASSWORD or AUTH_SECRET configuration." },
      { status: 500 }
    );
  }

  const ok = await checkPassword(password);
  if (!ok) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const token = await getExpectedSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
