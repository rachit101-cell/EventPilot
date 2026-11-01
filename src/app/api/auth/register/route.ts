import { NextRequest } from "next/server";
import crypto from "crypto";
import { queryOne, execute } from "@/lib/db";
import { hashPassword, createToken, setAuthCookie } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { User } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return errorResponse("Email, password, and name are required", "VALIDATION_ERROR", 400);
    }

    if (password.length < 6) {
      return errorResponse("Password must be at least 6 characters", "VALIDATION_ERROR", 400);
    }

    const existing = queryOne<User>("SELECT id FROM users WHERE email = ?", [email.toLowerCase().trim()]);
    if (existing) {
      return errorResponse("User with this email already exists", "USER_EXISTS", 409);
    }

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);

    execute(
      "INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)",
      [id, email.toLowerCase().trim(), passwordHash, name.trim()]
    );

    const newUser: User = {
      id,
      email: email.toLowerCase().trim(),
      name: name.trim(),
      created_at: new Date().toISOString(),
    };

    const token = createToken(newUser);
    await setAuthCookie(token);

    return successResponse(newUser, 201);
  } catch (err: any) {
    return errorResponse(err.message || "Failed to register user", "INTERNAL_ERROR", 500);
  }
}
