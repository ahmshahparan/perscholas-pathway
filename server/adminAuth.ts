import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getAdminByUsername } from "./db";
import { ENV } from "./_core/env";

export interface AdminTokenPayload {
  username: string;
  iat: number;
  exp: number;
}

export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  console.log('[AUTH] Verifying credentials for username:', username);
  const admin = await getAdminByUsername(username);
  if (!admin) {
    console.log('[AUTH] User not found:', username);
    return false;
  }
  console.log('[AUTH] User found:', admin.username, 'hash length:', admin.passwordHash.length);
  const isMatch = await bcrypt.compare(password, admin.passwordHash);
  console.log('[AUTH] Password match:', isMatch);
  return isMatch;
}

export function generateAdminToken(username: string): string {
  return jwt.sign({ username }, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

export function verifyAdminToken(token: string): AdminTokenPayload {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as AdminTokenPayload;
  } catch (error) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired token" });
  }
}

export function getUsernameFromToken(token: string): string {
  const payload = verifyAdminToken(token);
  return payload.username;
}

