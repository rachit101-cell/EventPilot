import { Task, TimelineMilestone } from "@/types";

export interface DateShiftResult {
  updatedTasks: Task[];
  updatedMilestones: TimelineMilestone[];
  adjustedCount: number;
}

export class TimelineService {
  /**
   * Calculate absolute ISO date string given an event date and a relative offset in days
   */
  static calculateDateFromOffset(eventDateStr: string, offsetDays: number): string {
    const eventDate = new Date(eventDateStr);
    const target = new Date(eventDate);
    target.setDate(target.getDate() + offsetDays);
    return target.toISOString().split("T")[0];
  }

  /**
   * Recalculate tasks and milestones when an event date changes.
   * If a task has a relative_offset_days and is not locked, its due_at is updated.
   */
  static shiftDatesForNewEventDate(
    newEventDateStr: string,
    tasks: Task[],
    milestones: TimelineMilestone[]
  ): DateShiftResult {
    let adjustedCount = 0;

    const updatedTasks = tasks.map((task) => {
      if (task.relative_offset_days !== null && task.relative_offset_days !== undefined) {
        const newDueAt = TimelineService.calculateDateFromOffset(newEventDateStr, task.relative_offset_days);
        if (newDueAt !== task.due_at) {
          adjustedCount++;
          return { ...task, due_at: newDueAt };
        }
      }
      return task;
    });

    const updatedMilestones = milestones.map((milestone) => {
      // Locked milestones keep their date
      if (milestone.locked) {
        return milestone;
      }
      return milestone;
    });

    return {
      updatedTasks,
      updatedMilestones,
      adjustedCount,
    };
  }

  /**
   * Validate dependency DAG. Ensures no circular dependencies and prerequisite is due before dependent.
   */
  static validateDependencies(
    tasks: Array<{ id: string; due_at?: string | null; dependency_ids: string[] }>
  ): { isValid: boolean; error?: string } {
    const taskMap = new Map(tasks.map((t) => [t.id, t]));

    // Check for cycles using DFS
    const visited = new Set<string>();
    const inStack = new Set<string>();

    function hasCycle(taskId: string): boolean {
      visited.add(taskId);
      inStack.add(taskId);

      const task = taskMap.get(taskId);
      if (task && task.dependency_ids) {
        for (const depId of task.dependency_ids) {
          if (!visited.has(depId)) {
            if (hasCycle(depId)) return true;
          } else if (inStack.has(depId)) {
            return true; // Cycle detected
          }
        }
      }

      inStack.delete(taskId);
      return false;
    }

    for (const task of tasks) {
      if (!visited.has(task.id)) {
        if (hasCycle(task.id)) {
          return { isValid: false, error: "Circular dependency detected between tasks." };
        }
      }
    }

    // Check that prerequisite due dates are not after dependent due dates
    for (const task of tasks) {
      if (!task.due_at) continue;
      const taskDue = new Date(task.due_at).getTime();

      for (const depId of task.dependency_ids) {
        const dep = taskMap.get(depId);
        if (dep?.due_at) {
          const depDue = new Date(dep.due_at).getTime();
          if (depDue > taskDue) {
            return {
              isValid: false,
              error: `Prerequisite task must be scheduled before dependent task (Prerequisite due: ${dep.due_at}, Dependent due: ${task.due_at})`,
            };
          }
        }
      }
    }

    return { isValid: true };
  }

  /**
   * Default milestone templates by event type
   */
  static getDefaultMilestones(
    eventType: "WEDDING" | "BIRTHDAY" | "COMMUNITY",
    eventDate?: string | null
  ): Array<{ title: string; offsetDays: number; due_at: string }> {
    const baseDate = eventDate || new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0];

    const weddingOffsets = [
      { title: "Venue & Catering Finalized", offsetDays: -90 },
      { title: "Photography & Decor Booked", offsetDays: -60 },
      { title: "Invitations Sent & RSVPs Tracked", offsetDays: -30 },
      { title: "Final Vendor Walkthrough & Rehearsal", offsetDays: -7 },
      { title: "Wedding Day Execution", offsetDays: 0 },
    ];

    const birthdayOffsets = [
      { title: "Theme & Guest List Finalized", offsetDays: -28 },
      { title: "Venue & Entertainment Booked", offsetDays: -21 },
      { title: "Invitations Sent", offsetDays: -14 },
      { title: "Cake & Catering Confirmed", offsetDays: -7 },
      { title: "Party Celebration Day", offsetDays: 0 },
    ];

    const communityOffsets = [
      { title: "Permits, Venue & Budget Approved", offsetDays: -45 },
      { title: "Vendor & Sponsor Outreach", offsetDays: -30 },
      { title: "Volunteer Schedule & Program Schedule", offsetDays: -14 },
      { title: "Equipment & Logistics Setup Check", offsetDays: -3 },
      { title: "Community Event Live Day", offsetDays: 0 },
    ];

    const offsets =
      eventType === "WEDDING"
        ? weddingOffsets
        : eventType === "BIRTHDAY"
        ? birthdayOffsets
        : communityOffsets;

    return offsets.map((m) => ({
      title: m.title,
      offsetDays: m.offsetDays,
      due_at: TimelineService.calculateDateFromOffset(baseDate, m.offsetDays),
    }));
  }
}
