import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { EventRepo } from "@/server/repositories/event.repo";
import { BudgetRepo } from "@/server/repositories/budget.repo";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);

    const { id: eventId } = await params;
    const event = EventRepo.findByIdAndOwner(eventId, user.id);
    if (!event) return errorResponse("Event not found", "NOT_FOUND", 404);

    const budget = BudgetRepo.getBudgetByEventId(eventId);
    const categories = budget ? BudgetRepo.getCategories(budget.id) : [];

    return successResponse({ budget, categories });
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
    const { category, estimated_minor, total_minor, contingency_minor } = body;

    const budget = BudgetRepo.getBudgetByEventId(eventId);
    if (!budget) return errorResponse("Budget not initialized", "NOT_FOUND", 404);

    if (total_minor !== undefined) {
      BudgetRepo.createOrUpdateBudget(
        eventId,
        Number(total_minor),
        event.currency,
        contingency_minor !== undefined ? Number(contingency_minor) : budget.contingency_minor
      );
    }

    if (category && estimated_minor !== undefined) {
      BudgetRepo.updateCategoryAmount(budget.id, category, Number(estimated_minor), "user_entered");
    }

    const updatedBudget = BudgetRepo.getBudgetByEventId(eventId);
    const categories = BudgetRepo.getCategories(budget.id);

    return successResponse({ budget: updatedBudget, categories });
  } catch (err: any) {
    return errorResponse(err.message, "INTERNAL_ERROR", 500);
  }
}
