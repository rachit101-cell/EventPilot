import { describe, it, expect } from "vitest";
import { TimelineService } from "@/server/domain/timeline.service";
import { Task, TimelineMilestone } from "@/types";

describe("TimelineService - Milestones and Dependencies", () => {
  it("calculates exact dates from relative offset days", () => {
    const eventDate = "2027-12-15";
    const offset = -30; // 30 days before
    const calcDate = TimelineService.calculateDateFromOffset(eventDate, offset);

    expect(calcDate).toBe("2027-11-15");
  });

  it("detects circular dependencies in task DAG", () => {
    const tasks = [
      { id: "task-1", due_at: "2027-10-01", dependency_ids: ["task-2"] },
      { id: "task-2", due_at: "2027-10-05", dependency_ids: ["task-3"] },
      { id: "task-3", due_at: "2027-10-10", dependency_ids: ["task-1"] }, // Cycle!
    ];

    const result = TimelineService.validateDependencies(tasks);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Circular dependency");
  });

  it("validates that prerequisite task is scheduled before dependent task", () => {
    const tasks = [
      { id: "task-prereq", due_at: "2027-11-10", dependency_ids: [] },
      { id: "task-dependent", due_at: "2027-11-01", dependency_ids: ["task-prereq"] }, // Prereq is after dependent!
    ];

    const result = TimelineService.validateDependencies(tasks);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Prerequisite task must be scheduled before");
  });

  it("shifts relative task dates when event date moves, preserving locked milestones", () => {
    const oldDate = "2027-10-15";
    const newDate = "2027-12-15"; // moved 2 months later

    const tasks: Task[] = [
      {
        id: "task-1",
        event_id: "evt-1",
        title: "Send Invites",
        due_at: "2027-09-15",
        relative_offset_days: -30,
        status: "TODO",
        priority: "HIGH",
        dependency_ids: [],
        source: "ai_generated",
        created_at: "",
      },
    ];

    const milestones: TimelineMilestone[] = [
      {
        id: "ms-1",
        event_id: "evt-1",
        title: "Fixed Government Permit",
        due_at: "2027-08-01",
        locked: true,
        status: "UPCOMING",
        created_at: "",
      },
    ];

    const shifted = TimelineService.shiftDatesForNewEventDate(newDate, tasks, milestones);

    expect(shifted.adjustedCount).toBe(1);
    expect(shifted.updatedTasks[0].due_at).toBe("2027-11-15"); // -30 days from 2027-12-15
    expect(shifted.updatedMilestones[0].due_at).toBe("2027-08-01"); // preserved because locked
  });
});
