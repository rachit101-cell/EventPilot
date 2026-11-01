import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";
import { successResponse } from "@/lib/api-response";

export async function POST() {
  await clearAuthCookie();
  return successResponse({ success: true });
}
