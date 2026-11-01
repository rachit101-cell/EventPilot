import crypto from "crypto";
import { query, queryOne, execute, transaction } from "@/lib/db";
import { Task, TimelineMilestone, TaskStatus, TaskPriority, MilestoneStatus, ProvenanceSource } from "@/types";

export class TaskRepo {
  static createTask(data: {
    eventId: string;
    title: string;
    description?: string;
    due_at?: string | null;
    relative_offset_days?: number | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    dependency_ids?: string[];
    source?: ProvenanceSource;
  }): Task {
    const id = crypto.randomUUID();
    const depsJson = JSON.stringify(data.dependency_ids || []);

    execute(
      `INSERT INTO tasks (
        id, event_id, title, description, due_at, relative_offset_days, 
        status, priority, dependency_ids, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.eventId,
        data.title,
        data.description || null,
        data.due_at || null,
        data.relative_offset_days ?? null,
        data.status || "TODO",
        data.priority || "MEDIUM",
        depsJson,
        data.source || "ai_generated",
      ]
    );

    return TaskRepo.findById(id)!;
  }

  static findById(id: string): Task | null {
    const row = queryOne<any>("SELECT * FROM tasks WHERE id = ?", [id]);
    if (!row) return null;
    return {
      ...row,
      dependency_ids: JSON.parse(row.dependency_ids || "[]"),
    };
  }

  static getTasksByEventId(eventId: string): Task[] {
    const rows = query<any>(
      "SELECT * FROM tasks WHERE event_id = ? ORDER BY due_at ASC, created_at ASC",
      [eventId]
    );
    return rows.map((r) => ({
      ...r,
      dependency_ids: JSON.parse(r.dependency_ids || "[]"),
    }));
  }

  static updateTaskStatus(id: string, eventId: string, status: TaskStatus): boolean {
    const res = execute(
      "UPDATE tasks SET status = ? WHERE id = ? AND event_id = ?",
      [status, id, eventId]
    );
    return res.changes > 0;
  }

  static updateTaskDue(id: string, eventId: string, due_at: string): boolean {
    const res = execute(
      "UPDATE tasks SET due_at = ?, source = 'user_entered' WHERE id = ? AND event_id = ?",
      [due_at, id, eventId]
    );
    return res.changes > 0;
  }

  static deleteTask(id: string, eventId: string): boolean {
    const res = execute("DELETE FROM tasks WHERE id = ? AND event_id = ?", [id, eventId]);
    return res.changes > 0;
  }

  static createMilestone(data: {
    eventId: string;
    title: string;
    due_at: string;
    locked?: boolean;
    status?: MilestoneStatus;
  }): TimelineMilestone {
    const id = crypto.randomUUID();
    execute(
      `INSERT INTO timeline_milestones (id, event_id, title, due_at, locked, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.eventId,
        data.title,
        data.due_at,
        data.locked ? 1 : 0,
        data.status || "UPCOMING",
      ]
    );

    return queryOne<TimelineMilestone>("SELECT * FROM timeline_milestones WHERE id = ?", [id])!;
  }

  static getMilestonesByEventId(eventId: string): TimelineMilestone[] {
    const rows = query<any>(
      "SELECT * FROM timeline_milestones WHERE event_id = ? ORDER BY due_at ASC",
      [eventId]
    );
    return rows.map((r) => ({
      ...r,
      locked: Boolean(r.locked),
    }));
  }

  static updateMilestoneStatus(id: string, eventId: string, status: MilestoneStatus): boolean {
    const res = execute(
      "UPDATE timeline_milestones SET status = ? WHERE id = ? AND event_id = ?",
      [status, id, eventId]
    );
    return res.changes > 0;
  }
}
