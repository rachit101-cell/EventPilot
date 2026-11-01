import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { EventRepo } from "@/server/repositories/event.repo";
import { BudgetRepo } from "@/server/repositories/budget.repo";
import { TaskRepo } from "@/server/repositories/task.repo";
import { VendorRepo } from "@/server/repositories/vendor.repo";
import { ConversationRepo } from "@/server/repositories/conversation.repo";
import { BudgetService } from "@/server/domain/budget.service";
import { TimelineService } from "@/server/domain/timeline.service";
import { AIAdapter } from "@/server/ai/adapter";
import { successResponse, errorResponse } from "@/lib/api-response";
import { transaction } from "@/lib/db";
import { BudgetCategoryName } from "@/types";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);

    const { id: eventId } = await params;
    const event = EventRepo.findByIdAndOwner(eventId, user.id);
    if (!event) return errorResponse("Event not found", "NOT_FOUND", 404);

    const body = await req.json().catch(() => ({}));
    const totalBudgetMinor = body.budget_minor || 150000000; // default ₹15 Lakhs if not provided

    // 1. Generate plan structure with AI
    const generated = await AIAdapter.generatePlan({
      ...event,
      budget_minor: totalBudgetMinor,
    });

    // 2. Deterministically allocate integer budget amounts using Largest Remainder Method
    const ratios = generated.budget_ratios.map((r) => ({
      category: r.category as BudgetCategoryName,
      percentage: r.percentage,
    }));
    const allocated = BudgetService.allocateBudget(totalBudgetMinor, ratios);

    // 3. Persist everything transactionally
    transaction(() => {
      // Create/Update Budget
      const contingencyAlloc = allocated.find((a) => a.category === "contingency");
      const contingencyMinor = contingencyAlloc ? contingencyAlloc.amount_minor : Math.round(totalBudgetMinor * 0.08);

      const budget = BudgetRepo.createOrUpdateBudget(
        eventId,
        totalBudgetMinor,
        event.currency || "INR",
        contingencyMinor
      );

      // Set Categories
      BudgetRepo.setCategories(
        budget.id,
        allocated.map((a) => ({
          category: a.category,
          estimated_minor: a.amount_minor,
          actual_minor: 0,
          source: "ai_generated",
          locked: false,
        }))
      );

      // Milestones
      for (const m of generated.milestones) {
        const dueDate = TimelineService.calculateDateFromOffset(
          event.date || new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
          m.offset_days
        );
        TaskRepo.createMilestone({
          eventId,
          title: m.title,
          due_at: dueDate,
          status: "UPCOMING",
          locked: false,
        });
      }

      // Tasks
      for (const t of generated.tasks) {
        const dueDate = TimelineService.calculateDateFromOffset(
          event.date || new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
          t.relative_offset_days
        );
        TaskRepo.createTask({
          eventId,
          title: t.title,
          description: t.description,
          due_at: dueDate,
          relative_offset_days: t.relative_offset_days,
          priority: t.priority,
          source: "ai_generated",
        });
      }

      // Vendors
      for (const v of generated.vendors) {
        VendorRepo.createVendor({
          eventId,
          category: v.category,
          name: v.role,
          notes: v.notes,
          status: "NOT_STARTED",
        });
      }

      // Ideas / Recommendations
      for (const idea of generated.ideas) {
        ConversationRepo.addRecommendation({
          eventId,
          kind: idea.kind,
          title: idea.title,
          description: idea.description,
          cost_range: idea.cost_range,
          source: "ai_generated",
        });
      }

      // Update event status to CONFIRMED/PLANNING
      EventRepo.update(eventId, user.id, { status: "PLANNING" });

      // Audit
      ConversationRepo.logAudit({
        eventId,
        actorId: user.id,
        action: "GENERATE_PLAN",
        after: { totalBudgetMinor, taskCount: generated.tasks.length },
      });
    });

    return successResponse({
      message: "Plan generated and synchronized successfully.",
      plan: generated,
    });
  } catch (err: any) {
    return errorResponse(err.message, "INTERNAL_ERROR", 500);
  }
}
