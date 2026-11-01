import { describe, it, expect } from "vitest";
import {
  OnboardingExtractionSchema,
  PlanGenerationSchema,
  ActionProposalSchema,
} from "@/server/ai/schemas";

describe("AI Schema Validation & Guardrails", () => {
  it("validates valid onboarding extraction output", () => {
    const valid = {
      event_type: "WEDDING",
      name: "Bengaluru Wedding",
      date: "2027-12-18",
      date_precision: "EXACT",
      city: "Bengaluru",
      country_code: "IN",
      guest_count: 250,
      budget_minor: 150000000,
      currency: "INR",
      style: "modern traditional",
      duration_hours: 8,
      food_preferences: ["Vegetarian"],
      special_requirements: [],
      confirmed_fields: ["event_type", "guest_count", "budget"],
      missing_fields: [],
      follow_up_questions: [],
      contradictions: [],
    };

    const res = OnboardingExtractionSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it("rejects unknown event types or negative guest counts", () => {
    const invalid = {
      event_type: "INVALID_GALA",
      guest_count: -10,
    };

    const res = OnboardingExtractionSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it("validates action proposals and enforces required fields", () => {
    const proposal = {
      intent: "UPDATE_BUDGET",
      confidence: 0.95,
      requires_confirmation: true,
      message: "Reducing decoration by ₹20,000",
      impact_summary: {
        budget_change_minor: -2000000,
        affected_categories: ["decoration"],
        affected_milestones: [],
        warnings: [],
      },
      operations: [
        {
          op: "set_budget_category",
          params: { category: "decoration", amount_minor: 16000000 },
        },
      ],
    };

    const res = ActionProposalSchema.safeParse(proposal);
    expect(res.success).toBe(true);
  });
});
