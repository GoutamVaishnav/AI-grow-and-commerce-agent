import crypto from "crypto";
import { promisify } from "util";

export const SESSION_COOKIE = "shopagent_session";
export const MERCHANT_EMAIL = (process.env.MERCHANT_EMAIL || "goutamvaishnav468@gmail.com").trim().toLowerCase();
export const ROLES = { USER: "user", MERCHANT: "merchant" };

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const scrypt = promisify(crypto.scrypt);

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function roleForEmail(email) {
  return normalizeEmail(email) === MERCHANT_EMAIL ? ROLES.MERCHANT : ROLES.USER;
}

export function validateRegistration({ name, email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedName = String(name || "").trim();

  if (!normalizedName || normalizedName.length > 80) return { error: "Enter a name up to 80 characters." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return { error: "Enter a valid email address." };
  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    return { error: "Password must be between 8 and 128 characters." };
  }

  return { name: normalizedName, email: normalizedEmail };
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${Buffer.from(hash).toString("hex")}`;
}

export async function verifyPassword(password, storedHash) {
  const [salt, expected] = String(storedHash || "").split(":");
  if (!salt || !expected || typeof password !== "string") return false;
  const actual = Buffer.from(await scrypt(password, salt, 64));
  const expectedBuffer = Buffer.from(expected, "hex");
  return actual.length === expectedBuffer.length && crypto.timingSafeEqual(actual, expectedBuffer);
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to a random value of at least 32 characters.");
  }
  return secret;
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decode(value) {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function sign(value) {
  return crypto.createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

export function createSessionToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: String(user._id),
    email: normalizeEmail(user.email),
    name: String(user.name || "User"),
    role: user.role,
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS,
  };
  const encodedPayload = encode(payload);
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function readSessionToken(token) {
  if (!token || typeof token !== "string") return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  let expectedSignature;
  try {
    expectedSignature = sign(encodedPayload);
  } catch {
    return null;
  }

  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return null;

  const payload = decode(encodedPayload);
  if (!payload?.sub || !payload?.email || !payload?.role || payload.exp <= Math.floor(Date.now() / 1000)) return null;
  if (payload.role !== ROLES.USER && payload.role !== ROLES.MERCHANT) return null;
  return { id: payload.sub, email: payload.email, name: payload.name, role: payload.role };
}

export function getSessionFromRequest(request) {
  return readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

export function getSessionFromCookies(cookieStore) {
  return readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export function isMerchant(session) {
  return session?.role === ROLES.MERCHANT && session.email === MERCHANT_EMAIL;
}

export function safeUser(user) {
  return { id: String(user._id), name: user.name, email: user.email, role: user.role };
}

export function setSessionCookie(response, token) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

export function clearSessionCookie(response) {
  response.cookies.set({ name: SESSION_COOKIE, value: "", httpOnly: true, sameSite: "lax", maxAge: 0, path: "/" });
}
