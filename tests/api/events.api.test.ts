import { describe, it, expect } from "vitest";
import { EventRepo } from "@/server/repositories/event.repo";
import { BudgetRepo } from "@/server/repositories/budget.repo";
import { TaskRepo } from "@/server/repositories/task.repo";
import { VendorRepo } from "@/server/repositories/vendor.repo";
import { ConversationRepo } from "@/server/repositories/conversation.repo";
import { BudgetService } from "@/server/domain/budget.service";
import { TimelineService } from "@/server/domain/timeline.service";
import { execute } from "@/lib/db";

describe("EventPilot End-to-End Database & Domain Pipeline", () => {
  const testUserId = "user_test_runner_1";

  it("creates an event, generates plan, verifies persistence across tables", () => {
    // 1. Ensure test user exists in users table (foreign key prerequisite)
    execute(
      "INSERT OR IGNORE INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)",
      [testUserId, "test@example.com", "hash123", "Test Planner"]
    );

    // 2. Create Event
    const event = EventRepo.create({
      owner_id: testUserId,
      name: "Bangalore Winter Wedding",
      event_type: "WEDDING",
      date: "2027-12-18",
      date_precision: "EXACT",
      city: "Bengaluru",
      guest_count: 250,
      currency: "INR",
    });

    expect(event.id).toBeDefined();
    expect(event.guest_count).toBe(250);

    // 3. Allocate Budget for ₹15 Lakhs
    const totalMinor = 150000000;
    const ratios = BudgetService.getDefaultRatios("WEDDING");
    const allocated = BudgetService.allocateBudget(totalMinor, ratios);
    const contingencyMinor = allocated.find((a) => a.category === "contingency")?.amount_minor || 12000000;

    const budget = BudgetRepo.createOrUpdateBudget(event.id, totalMinor, "INR", contingencyMinor);
    BudgetRepo.setCategories(
      budget.id,
      allocated.map((a) => ({
        category: a.category,
        estimated_minor: a.amount_minor,
        actual_minor: 0,
        source: "ai_generated",
      }))
    );

    const savedCategories = BudgetRepo.getCategories(budget.id);
    expect(savedCategories.length).toBe(ratios.length);
    const sum = savedCategories.reduce((acc, c) => acc + c.estimated_minor, 0);
    expect(sum).toBe(totalMinor);

    // 4. Create milestones and tasks
    const milestones = TimelineService.getDefaultMilestones("WEDDING", event.date);
    for (const m of milestones) {
      TaskRepo.createMilestone({
        eventId: event.id,
        title: m.title,
        due_at: m.due_at,
      });
    }
    const savedMilestones = TaskRepo.getMilestonesByEventId(event.id);
    expect(savedMilestones.length).toBe(milestones.length);

    // 5. Add Expense and verify actual spend updates
    const expense = BudgetRepo.addExpense({
      eventId: event.id,
      category: "catering",
      description: "Advance payment for catering banquet",
      actualMinor: 5000000, // ₹50,000
    });
    expect(expense.id).toBeDefined();

    const updatedCatering = BudgetRepo.getCategories(budget.id).find((c) => c.category === "catering");
    expect(updatedCatering?.actual_minor).toBe(5000000);

    // 6. Cross-user isolation: Another user cannot read this event
    const otherUserEvent = EventRepo.findByIdAndOwner(event.id, "unauthorized_user_999");
    expect(otherUserEvent).toBeNull();
  });
});
