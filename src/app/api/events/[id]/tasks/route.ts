import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { EventRepo } from "@/server/repositories/event.repo";
import { TaskRepo } from "@/server/repositories/task.repo";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);

    const { id: eventId } = await params;
    const event = EventRepo.findByIdAndOwner(eventId, user.id);
    if (!event) return errorResponse("Event not found", "NOT_FOUND", 404);

    const tasks = TaskRepo.getTasksByEventId(eventId);
    return successResponse(tasks);
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
    const { title, description, due_at, priority, dependency_ids } = body;

    if (!title) return errorResponse("Title is required", "VALIDATION_ERROR", 400);

    const task = TaskRepo.createTask({
      eventId,
      title,
      description,
      due_at,
      priority: priority || "MEDIUM",
      dependency_ids: dependency_ids || [],
      source: "user_entered",
    });

    return successResponse(task, 201);
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
    const { taskId, status, due_at } = body;

    if (!taskId) return errorResponse("taskId is required", "VALIDATION_ERROR", 400);

    if (status) {
      TaskRepo.updateTaskStatus(taskId, eventId, status);
    }
    if (due_at !== undefined) {
      TaskRepo.updateTaskDue(taskId, eventId, due_at);
    }

    const updated = TaskRepo.findById(taskId);
    return successResponse(updated);
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
    const taskId = searchParams.get("taskId");

    if (!taskId) return errorResponse("taskId is required", "VALIDATION_ERROR", 400);

    const deleted = TaskRepo.deleteTask(taskId, eventId);
    if (!deleted) return errorResponse("Task not found", "NOT_FOUND", 404);

    return successResponse({ success: true });
  } catch (err: any) {
    return errorResponse(err.message, "INTERNAL_ERROR", 500);
  }
}
