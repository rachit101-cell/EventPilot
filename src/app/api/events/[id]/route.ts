import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { EventRepo } from "@/server/repositories/event.repo";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);

    const { id } = await params;
    const event = EventRepo.findByIdAndOwner(id, user.id);
    if (!event) return errorResponse("Event not found", "NOT_FOUND", 404);

    return successResponse(event);
  } catch (err: any) {
    return errorResponse(err.message, "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);

    const { id } = await params;
    const body = await req.json();

    const updated = EventRepo.update(id, user.id, body);
    if (!updated) return errorResponse("Event not found or unauthorized", "NOT_FOUND", 404);

    return successResponse(updated);
  } catch (err: any) {
    return errorResponse(err.message, "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);

    const { id } = await params;
    const deleted = EventRepo.delete(id, user.id);
    if (!deleted) return errorResponse("Event not found or unauthorized", "NOT_FOUND", 404);

    return successResponse({ success: true });
  } catch (err: any) {
    return errorResponse(err.message, "INTERNAL_ERROR", 500);
  }
}
