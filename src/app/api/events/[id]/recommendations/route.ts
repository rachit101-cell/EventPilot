import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { EventRepo } from "@/server/repositories/event.repo";
import { ConversationRepo } from "@/server/repositories/conversation.repo";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);

    const { id: eventId } = await params;
    const event = EventRepo.findByIdAndOwner(eventId, user.id);
    if (!event) return errorResponse("Event not found", "NOT_FOUND", 404);

    const recommendations = ConversationRepo.getRecommendationsByEventId(eventId);
    return successResponse(recommendations);
  } catch (err: any) {
    return errorResponse(err.message, "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);

    const { id: eventId } = await params;
    const event = EventRepo.findByIdAndOwner(eventId, user.id);
    if (!event) return errorResponse("Event not found", "NOT_FOUND", 404);

    const body = await req.json();
    const { ideaId, dismissed } = body;

    if (!ideaId) return errorResponse("ideaId is required", "VALIDATION_ERROR", 400);

    if (dismissed) {
      ConversationRepo.dismissRecommendation(ideaId, eventId);
    }

    return successResponse({ success: true });
  } catch (err: any) {
    return errorResponse(err.message, "INTERNAL_ERROR", 500);
  }
}
