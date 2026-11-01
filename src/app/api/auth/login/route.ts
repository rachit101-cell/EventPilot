import { NextRequest } from "next/server";
import { queryOne } from "@/lib/db";
import { comparePassword, createToken, setAuthCookie } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { User } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse("Email and password are required", "VALIDATION_ERROR", 400);
    }

    const userRecord = queryOne<any>(
      "SELECT id, email, password_hash, name, created_at FROM users WHERE email = ?",
      [email.toLowerCase().trim()]
    );

    if (!userRecord) {
      return errorResponse("Invalid email or password", "UNAUTHORIZED", 401);
    }

    const isValid = await comparePassword(password, userRecord.password_hash);
    if (!isValid) {
      return errorResponse("Invalid email or password", "UNAUTHORIZED", 401);
    }

    const user: User = {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      created_at: userRecord.created_at,
    };

    const token = createToken(user);
    await setAuthCookie(token);

    return successResponse(user);
  } catch (err: any) {
    return errorResponse(err.message || "Failed to login", "INTERNAL_ERROR", 500);
  }
}
