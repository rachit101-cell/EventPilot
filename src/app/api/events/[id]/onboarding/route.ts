import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { EventRepo } from "@/server/repositories/event.repo";
import { AIAdapter } from "@/server/ai/adapter";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);

    const { id } = await params;
    const event = EventRepo.findByIdAndOwner(id, user.id);
    if (!event) return errorResponse("Event not found", "NOT_FOUND", 404);

    const body = await req.json();
    const { prompt } = body;

    if (!prompt) {
      return errorResponse("Prompt is required", "VALIDATION_ERROR", 400);
    }

    const extraction = await AIAdapter.extractOnboarding(prompt, event);
    return successResponse(extraction);
  } catch (err: any) {
    return errorResponse(err.message, "INTERNAL_ERROR", 500);
  }
}
