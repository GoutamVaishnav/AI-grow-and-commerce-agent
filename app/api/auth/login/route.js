import { NextResponse } from "next/server";
import { createSessionToken, normalizeEmail, safeUser, setSessionCookie, verifyPassword } from "@/lib/auth";
import { getUsersCollection } from "@/lib/mongodb";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = normalizeEmail(body.email);
    if (!email || typeof body.password !== "string") {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = await (await getUsersCollection()).findOne({ email });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const response = NextResponse.json({ user: safeUser(user) });
    setSessionCookie(response, createSessionToken(user));
    return response;
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json({ error: "Unable to sign in. Check MongoDB configuration and try again." }, { status: 500 });
  }
}
