import { describe, it, expect } from "vitest";
import { BudgetService } from "@/server/domain/budget.service";

describe("BudgetService - Deterministic Integer Math", () => {
  it("allocates budget without losing or gaining a single paise (Zero Drift)", () => {
    const totalMinor = 150000000; // ₹15,00,000 in paise
    const ratios = BudgetService.getDefaultRatios("WEDDING");

    const allocated = BudgetService.allocateBudget(totalMinor, ratios);
    const sum = allocated.reduce((acc, curr) => acc + curr.amount_minor, 0);

    expect(sum).toBe(totalMinor);
    expect(allocated.length).toBe(ratios.length);
    for (const item of allocated) {
      expect(item.amount_minor).toBeGreaterThan(0);
      expect(Number.isInteger(item.amount_minor)).toBe(true);
    }
  });

  it("handles odd numbers cleanly using the Largest Remainder Method", () => {
    const totalMinor = 33333333; // ₹3,33,333.33
    const ratios = [
      { category: "venue" as const, percentage: 33.33 },
      { category: "catering" as const, percentage: 33.33 },
      { category: "decoration" as const, percentage: 33.34 },
    ];

    const allocated = BudgetService.allocateBudget(totalMinor, ratios);
    const sum = allocated.reduce((acc, curr) => acc + curr.amount_minor, 0);

    expect(sum).toBe(totalMinor);
  });

  it("calculates summary and detects overspend accurately", () => {
    const totalMinor = 10000000; // ₹1,00,000
    const categories = [
      { category: "venue", estimated_minor: 4000000, actual_minor: 4500000 },
      { category: "catering", estimated_minor: 4000000, actual_minor: 6000000 },
    ];
    const contingencyMinor = 2000000;

    const summary = BudgetService.calculateSummary(totalMinor, categories, contingencyMinor);

    expect(summary.total_minor).toBe(10000000);
    expect(summary.actual_spent_minor).toBe(10500000);
    expect(summary.remaining_minor).toBe(-500000); // -₹5,000
    expect(summary.is_over_budget).toBe(true);
    expect(summary.overspend_minor).toBe(500000);
  });

  it("modifies a category and calculates unallocated balance", () => {
    const totalMinor = 10000000;
    const categories = [
      { category: "decoration" as const, estimated_minor: 3000000 },
      { category: "venue" as const, estimated_minor: 5000000 },
    ];

    // Reduce decoration by 10,00,000 paise (₹10,000)
    const result = BudgetService.modifyCategory(categories, totalMinor, "decoration", 2000000);

    expect(result.differenceMinor).toBe(-1000000);
    const updatedDecor = result.updatedCategories.find((c) => c.category === "decoration");
    expect(updatedDecor?.estimated_minor).toBe(2000000);
    expect(result.newUnallocatedMinor).toBe(3000000); // 10,000,000 - 7,000,000
  });
});
