import { NextResponse } from "next/server";
import { createSessionToken, hashPassword, roleForEmail, safeUser, setSessionCookie, validateRegistration } from "@/lib/auth";
import { getUsersCollection } from "@/lib/mongodb";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const validated = validateRegistration(body);
    if (validated.error) return NextResponse.json({ error: validated.error }, { status: 400 });

    const users = await getUsersCollection();
    const user = {
      name: validated.name,
      email: validated.email,
      passwordHash: await hashPassword(body.password),
      role: roleForEmail(validated.email),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const created = await users.insertOne(user);
    user._id = created.insertedId;

    const response = NextResponse.json({ user: safeUser(user) }, { status: 201 });
    setSessionCookie(response, createSessionToken(user));
    return response;
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json({ error: "An account already exists for this email. Please sign in." }, { status: 409 });
    }
    console.error("Signup failed", error);
    return NextResponse.json({ error: "Unable to create account. Check MongoDB configuration and try again." }, { status: 500 });
  }
}
