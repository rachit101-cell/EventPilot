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

    const expenses = BudgetRepo.getExpensesByEventId(eventId);
    return successResponse(expenses);
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
    const { category, description, actual_minor, estimated_minor, status } = body;

    if (!category || !description || actual_minor === undefined) {
      return errorResponse("Category, description, and actual_minor are required.", "VALIDATION_ERROR", 400);
    }

    const expense = BudgetRepo.addExpense({
      eventId,
      category,
      description,
      actualMinor: Number(actual_minor),
      estimatedMinor: estimated_minor ? Number(estimated_minor) : undefined,
      currency: event.currency,
      status: status || "PAID",
    });

    return successResponse(expense, 201);
  } catch (err: any) {
    return errorResponse(err.message, "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);

    const { id: eventId } = await params;
    const { searchParams } = new URL(req.url);
    const expenseId = searchParams.get("expenseId");

    if (!expenseId) {
      return errorResponse("expenseId query param is required", "VALIDATION_ERROR", 400);
    }

    const deleted = BudgetRepo.deleteExpense(expenseId, eventId);
    if (!deleted) return errorResponse("Expense not found", "NOT_FOUND", 404);

    return successResponse({ success: true });
  } catch (err: any) {
    return errorResponse(err.message, "INTERNAL_ERROR", 500);
  }
}
