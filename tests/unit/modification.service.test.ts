import { describe, it, expect } from "vitest";
import { ModificationService } from "@/server/domain/modification.service";
import { EventItem, BudgetCategory } from "@/types";

describe("ModificationService - Impact Analysis & Conversational Rules", () => {
  const mockEvent: EventItem = {
    id: "evt-123",
    owner_id: "user-1",
    name: "Ravi & Asha Wedding",
    event_type: "WEDDING",
    date: "2027-12-18",
    date_precision: "EXACT",
    city: "Bengaluru",
    country_code: "IN",
    guest_count: 250,
    currency: "INR",
    status: "PLANNING",
    created_at: "",
    updated_at: "",
  };

  const mockCategories: BudgetCategory[] = [
    {
      id: "c1",
      budget_id: "b1",
      category: "catering",
      estimated_minor: 45000000, // ₹4.5L for 250 guests = ₹1,800/plate
      actual_minor: 0,
      source: "ai_generated",
      locked: false,
      created_at: "",
    },
    {
      id: "c2",
      budget_id: "b1",
      category: "decoration",
      estimated_minor: 18000000, // ₹1.8L
      actual_minor: 0,
      source: "ai_generated",
      locked: false,
      created_at: "",
    },
  ];

  it("analyzes increasing guest count from 250 to 350 without increasing budget", () => {
    const result = ModificationService.analyzeGuestCountChange(
      mockEvent,
      mockCategories,
      350,
      true // preserve total budget
    );

    expect(result.proposal.intent).toBe("UPDATE_EVENT");
    expect(result.proposal.requires_confirmation).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);

    // Expect catering to increase and decoration to be reallocated
    const cateringOp = result.proposal.operations.find(
      (op) => op.op === "set_budget_category" && op.params.category === "catering"
    );
    expect(cateringOp).toBeDefined();
    expect(cateringOp?.params.amount_minor).toBeGreaterThan(45000000);

    const guestOp = result.proposal.operations.find((op) => op.op === "adjust_guest_count");
    expect(guestOp?.params.guest_count).toBe(350);
  });

  it("analyzes reducing decoration by ₹20,000", () => {
    const proposal = ModificationService.analyzeBudgetReduction(
      "decoration",
      18000000, // current ₹1.8L
      2000000,  // ₹20,000 in paise
      "INR"
    );

    expect(proposal.intent).toBe("UPDATE_BUDGET");
    expect(proposal.impact_summary.budget_change_minor).toBe(-2000000);
    expect(proposal.operations[0].params.amount_minor).toBe(16000000); // 1.8L - 20k
  });
});
