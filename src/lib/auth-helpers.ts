import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// This file contains auth helpers that use bcrypt
// It should only be imported in Node.js runtime (not Edge Runtime)

export async function verifyPassword(plainPassword: string, hashedPassword: string) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function getUserByEmail(email: string) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user[0] || null;
}