import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * パスワードをハッシュ化
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * パスワードを検証
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * ユーザーを作成
 */
export async function createUser(
  email: string,
  password: string,
  name?: string
) {
  const hashedPassword = await hashPassword(password);
  
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error("User already exists");
  }

  const newUser = await db
    .insert(users)
    .values({
      id: nanoid(),
      email,
      password: hashedPassword,
      name: name || null,
    })
    .returning();

  return newUser[0];
}

/**
 * メールアドレスでユーザーを検索
 */
export async function getUserByEmail(email: string) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user[0] || null;
}

/**
 * ユーザーIDでユーザーを検索
 */
export async function getUserById(id: string) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user[0] || null;
}

/**
 * ユーザーのロールを更新
 */
export async function updateUserRole(userId: string, role: string) {
  const updatedUser = await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  return updatedUser[0];
}