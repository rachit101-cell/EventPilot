import { NextRequest } from "next/server";
import { AIAdapter } from "@/server/ai/adapter";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, context } = body;

    if (!prompt || typeof prompt !== "string") {
      return errorResponse("Natural language prompt is required.", "VALIDATION_ERROR", 400);
    }

    const extraction = await AIAdapter.extractOnboarding(prompt, context || {});
    return successResponse(extraction);
  } catch (err: any) {
    return errorResponse(err.message, "INTERNAL_ERROR", 500);
  }
}
