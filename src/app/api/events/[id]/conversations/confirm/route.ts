import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { EventRepo } from "@/server/repositories/event.repo";
import { BudgetRepo } from "@/server/repositories/budget.repo";
import { TaskRepo } from "@/server/repositories/task.repo";
import { VendorRepo } from "@/server/repositories/vendor.repo";
import { ConversationRepo } from "@/server/repositories/conversation.repo";
import { TimelineService } from "@/server/domain/timeline.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { transaction } from "@/lib/db";
import { ActionProposal, ActionOperation } from "@/types";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);

    const { id: eventId } = await params;
    const event = EventRepo.findByIdAndOwner(eventId, user.id);
    if (!event) return errorResponse("Event not found", "NOT_FOUND", 404);

    const body = await req.json();
    const { messageId, operations } = body;

    const opsToApply: ActionOperation[] = operations || [];

    // Apply transactionally
    transaction(() => {
      const budget = BudgetRepo.getBudgetByEventId(eventId);

      for (const op of opsToApply) {
        switch (op.op) {
          case "set_budget_category": {
            if (budget && op.params.category && op.params.amount_minor !== undefined) {
              BudgetRepo.updateCategoryAmount(
                budget.id,
                op.params.category,
                Number(op.params.amount_minor),
                "ai_generated"
              );
            }
            break;
          }
          case "adjust_guest_count": {
            if (op.params.guest_count) {
              EventRepo.update(eventId, user.id, {
                guest_count: Number(op.params.guest_count),
              });
            }
            break;
          }
          case "update_event_date": {
            if (op.params.date) {
              EventRepo.update(eventId, user.id, { date: op.params.date });
              // Shift relative tasks
              const allTasks = TaskRepo.getTasksByEventId(eventId);
              const allMilestones = TaskRepo.getMilestonesByEventId(eventId);
              const shifted = TimelineService.shiftDatesForNewEventDate(op.params.date, allTasks, allMilestones);
              for (const t of shifted.updatedTasks) {
                if (t.due_at) {
                  TaskRepo.updateTaskDue(t.id, eventId, t.due_at);
                }
              }
            }
            break;
          }
          case "add_task": {
            if (op.params.title) {
              TaskRepo.createTask({
                eventId,
                title: op.params.title,
                description: op.params.description || "",
                due_at: op.params.due_at || null,
                priority: op.params.priority || "MEDIUM",
                source: "ai_generated",
              });
            }
            break;
          }
          case "update_task_due": {
            if (op.params.task_id && op.params.due_at) {
              TaskRepo.updateTaskDue(op.params.task_id, eventId, op.params.due_at);
            }
            break;
          }
          case "remove_task": {
            if (op.params.task_id) {
              TaskRepo.deleteTask(op.params.task_id, eventId);
            }
            break;
          }
          case "add_vendor": {
            if (op.params.name && op.params.category) {
              VendorRepo.createVendor({
                eventId,
                category: op.params.category,
                name: op.params.name,
                notes: op.params.notes,
                status: "NOT_STARTED",
              });
            }
            break;
          }
        }
      }

      if (messageId) {
        ConversationRepo.updateMessageStatus(messageId, "APPLIED");
      }

      ConversationRepo.logAudit({
        eventId,
        actorId: user.id,
        action: "APPLY_CONVERSATION_MODIFICATION",
        after: opsToApply,
      });
    });

    return successResponse({
      success: true,
      applied_operations_count: opsToApply.length,
    });
  } catch (err: any) {
    return errorResponse(err.message, "INTERNAL_ERROR", 500);
  }
}
