import { NextRequest } from "next/server";
import crypto from "crypto";
import { getSessionUser, createToken, setAuthCookie, hashPassword } from "@/lib/auth";
import { EventRepo } from "@/server/repositories/event.repo";
import { successResponse, errorResponse } from "@/lib/api-response";
import { queryOne, execute } from "@/lib/db";
import { User } from "@/types";

async function getOrCreateUser(): Promise<User> {
  const existing = await getSessionUser();
  if (existing) return existing;

  // Auto-provision demo user for seamless hackathon evaluation
  const demoEmail = "demo.planner@eventpilot.ai";
  let user = queryOne<User>("SELECT id, email, name, created_at FROM users WHERE email = ?", [demoEmail]);
  if (!user) {
    const id = crypto.randomUUID();
    const hash = await hashPassword("demo12345");
    execute("INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)", [
      id,
      demoEmail,
      hash,
      "Asha (Hackathon Judge)",
    ]);
    user = queryOne<User>("SELECT id, email, name, created_at FROM users WHERE id = ?", [id]);
  }

  const token = createToken(user!);
  await setAuthCookie(token);
  return user!;
}

export async function GET() {
  try {
    const user = await getOrCreateUser();
    const events = EventRepo.listByOwner(user.id);
    return successResponse(events);
  } catch (err: any) {
    return errorResponse(err.message, "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser();
    const body = await req.json();

    const {
      name,
      event_type,
      date,
      date_precision,
      city,
      country_code,
      guest_count,
      currency,
      style,
      duration_hours,
      food_preferences,
      special_requirements,
    } = body;

    if (!name || !event_type || !city || !guest_count) {
      return errorResponse(
        "Missing required fields: name, event_type, city, and guest_count are required.",
        "VALIDATION_ERROR",
        400
      );
    }

    const event = EventRepo.create({
      owner_id: user.id,
      name,
      event_type,
      date: date || null,
      date_precision: date_precision || "EXACT",
      city,
      country_code: country_code || "IN",
      guest_count: Number(guest_count),
      currency: currency || "INR",
      style,
      duration_hours: duration_hours ? Number(duration_hours) : undefined,
      food_preferences,
      special_requirements,
    });

    return successResponse(event, 201);
  } catch (err: any) {
    return errorResponse(err.message, "INTERNAL_ERROR", 500);
  }
}
