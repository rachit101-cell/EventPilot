import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { EventRepo } from "@/server/repositories/event.repo";
import { BudgetRepo } from "@/server/repositories/budget.repo";
import { TaskRepo } from "@/server/repositories/task.repo";
import { ConversationRepo } from "@/server/repositories/conversation.repo";
import { AIAdapter } from "@/server/ai/adapter";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);

    const { id: eventId } = await params;
    const event = EventRepo.findByIdAndOwner(eventId, user.id);
    if (!event) return errorResponse("Event not found", "NOT_FOUND", 404);

    const messages = ConversationRepo.getMessagesByEventId(eventId);
    return successResponse(messages);
  } catch (err: any) {
    return errorResponse(err.message, "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);

    const { id: eventId } = await params;
    const event = EventRepo.findByIdAndOwner(eventId, user.id);
    if (!event) return errorResponse("Event not found", "NOT_FOUND", 404);

    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return errorResponse("Message is required", "VALIDATION_ERROR", 400);
    }

    // 1. Record user message
    ConversationRepo.addMessage({
      eventId,
      userId: user.id,
      role: "user",
      content: message,
    });

    // 2. Fetch context
    const budget = BudgetRepo.getBudgetByEventId(eventId);
    const categories = budget ? BudgetRepo.getCategories(budget.id) : [];
    const tasks = TaskRepo.getTasksByEventId(eventId);
    const milestones = TaskRepo.getMilestonesByEventId(eventId);

    const state = {
      event,
      budget: {
        total_minor: budget ? budget.total_minor : 0,
        currency: event.currency,
        categories,
      },
      tasks: tasks.slice(0, 15),
      milestones,
    };

    // 3. Process AI modification
    const proposal = await AIAdapter.processModification(message, state);

    // 4. Save assistant response with proposal
    const assistantMsg = ConversationRepo.addMessage({
      eventId,
      userId: user.id,
      role: "assistant",
      content: proposal.message,
      intent: proposal.intent,
      proposed_diff: proposal.requires_confirmation ? (proposal as any) : null,
      status: proposal.requires_confirmation ? "PENDING_CONFIRMATION" : "NONE",
    });

    return successResponse({
      message: assistantMsg,
      proposal,
    });
  } catch (err: any) {
    return errorResponse(err.message, "INTERNAL_ERROR", 500);
  }
}
