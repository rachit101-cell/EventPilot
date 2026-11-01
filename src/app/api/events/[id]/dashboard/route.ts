import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { EventRepo } from "@/server/repositories/event.repo";
import { BudgetRepo } from "@/server/repositories/budget.repo";
import { TaskRepo } from "@/server/repositories/task.repo";
import { VendorRepo } from "@/server/repositories/vendor.repo";
import { ConversationRepo } from "@/server/repositories/conversation.repo";
import { BudgetService } from "@/server/domain/budget.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { DashboardProjection } from "@/types";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);

    const { id: eventId } = await params;
    const event = EventRepo.findByIdAndOwner(eventId, user.id);
    if (!event) return errorResponse("Event not found", "NOT_FOUND", 404);

    // Fetch budget data
    const budgetRecord = BudgetRepo.getBudgetByEventId(eventId);
    const totalMinor = budgetRecord ? budgetRecord.total_minor : 0;
    const contingencyMinor = budgetRecord ? budgetRecord.contingency_minor : 0;
    const categories = budgetRecord ? BudgetRepo.getCategories(budgetRecord.id) : [];
    const expenses = BudgetRepo.getExpensesByEventId(eventId);

    const budgetSummary = BudgetService.calculateSummary(totalMinor, categories, contingencyMinor);

    // Fetch timeline & tasks
    const milestones = TaskRepo.getMilestonesByEventId(eventId);
    const tasks = TaskRepo.getTasksByEventId(eventId);
    const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
    const nowStr = new Date().toISOString().split("T")[0];
    const overdueTasks = tasks.filter((t) => t.status !== "COMPLETED" && t.due_at && t.due_at < nowStr).length;

    // Fetch vendors
    const vendors = VendorRepo.getVendorsByEventId(eventId);
    let totalQuoted = 0;
    let totalPaid = 0;
    for (const v of vendors) {
      if (v.quotes) {
        for (const q of v.quotes) {
          totalQuoted += q.amount_minor;
          totalPaid += q.advance_paid_minor;
        }
      }
    }

    // Fetch recommendations and conversations
    const recommendations = ConversationRepo.getRecommendationsByEventId(eventId);
    const recentConversations = ConversationRepo.getMessagesByEventId(eventId);

    const projection: DashboardProjection = {
      event,
      budget: {
        total_minor: totalMinor,
        currency: event.currency || "INR",
        allocated_minor: budgetSummary.allocated_minor,
        actual_spent_minor: budgetSummary.actual_spent_minor,
        remaining_minor: budgetSummary.remaining_minor,
        contingency_minor: contingencyMinor,
        is_over_budget: budgetSummary.is_over_budget,
        categories,
        expenses,
      },
      timeline: {
        milestones,
        tasks,
        completed_task_count: completedTasks,
        total_task_count: tasks.length,
        overdue_task_count: overdueTasks,
      },
      vendors: {
        checklist: vendors,
        total_quoted_minor: totalQuoted,
        total_paid_minor: totalPaid,
        total_balance_minor: Math.max(0, totalQuoted - totalPaid),
      },
      recommendations,
      recent_conversations: recentConversations.slice(-20),
    };

    return successResponse(projection);
  } catch (err: any) {
    return errorResponse(err.message, "INTERNAL_ERROR", 500);
  }
}
