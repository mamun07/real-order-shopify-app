import crypto from "node:crypto";
import db from "../db.server";

export const OTP_TTL_SECONDS = 5 * 60; // a fresh code is valid for 5 minutes
export const OTP_RESEND_SECONDS = 90; // "Resend Code" unlocks after 1:30
const CODE_TTL_MS = OTP_TTL_SECONDS * 1000;
const MAX_ATTEMPTS = 5;
const VERIFY_WINDOW_MS = 20 * 60 * 1000; // a verified number stays good for 20 min at checkout

export function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function hashCode(shop, phone, code) {
  return crypto
    .createHash("sha256")
    .update(`${shop}:${phone}:${code}`)
    .digest("hex");
}

export function generateCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function createChallenge(shop, phone, code) {
  // Only one live challenge per number.
  await db.otpChallenge.deleteMany({ where: { shop, phone, verifiedAt: null } });
  return db.otpChallenge.create({
    data: {
      shop,
      phone,
      codeHash: hashCode(shop, phone, code),
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  });
}

export async function verifyChallenge(shop, phone, code) {
  const challenge = await db.otpChallenge.findFirst({
    where: { shop, phone, verifiedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!challenge) {
    return { ok: false, reason: "No code was requested for this number." };
  }
  if (challenge.expiresAt < new Date()) {
    return { ok: false, reason: "The code has expired. Request a new one." };
  }
  if (challenge.attempts >= MAX_ATTEMPTS) {
    return { ok: false, reason: "Too many attempts. Request a new code." };
  }
  if (challenge.codeHash !== hashCode(shop, phone, String(code))) {
    await db.otpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, reason: "That code is incorrect." };
  }
  await db.otpChallenge.update({
    where: { id: challenge.id },
    data: { verifiedAt: new Date() },
  });
  return { ok: true };
}

export async function isPhoneVerified(shop, phone) {
  const recent = await db.otpChallenge.findFirst({
    where: {
      shop,
      phone,
      verifiedAt: { gte: new Date(Date.now() - VERIFY_WINDOW_MS) },
    },
    orderBy: { verifiedAt: "desc" },
  });
  return !!recent;
}
