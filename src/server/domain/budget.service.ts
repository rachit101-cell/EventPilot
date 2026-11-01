import { BudgetCategoryName } from "@/types";

export interface CategoryRatio {
  category: BudgetCategoryName;
  percentage: number; // e.g. 35 for 35%
}

export interface BudgetSummary {
  total_minor: number;
  allocated_minor: number;
  actual_spent_minor: number;
  remaining_minor: number;
  contingency_minor: number;
  unallocated_minor: number;
  is_over_budget: boolean;
  overspend_minor: number;
}

export class BudgetService {
  /**
   * Standard benchmark budget category allocations by event type
   */
  static getDefaultRatios(eventType: "WEDDING" | "BIRTHDAY" | "COMMUNITY"): CategoryRatio[] {
    switch (eventType) {
      case "WEDDING":
        return [
          { category: "venue", percentage: 25 },
          { category: "catering", percentage: 30 },
          { category: "decoration", percentage: 12 },
          { category: "photography", percentage: 10 },
          { category: "entertainment", percentage: 8 },
          { category: "invitations", percentage: 2 },
          { category: "transportation", percentage: 3 },
          { category: "miscellaneous", percentage: 2 },
          { category: "contingency", percentage: 8 },
        ];
      case "BIRTHDAY":
        return [
          { category: "venue", percentage: 20 },
          { category: "catering", percentage: 35 },
          { category: "decoration", percentage: 15 },
          { category: "entertainment", percentage: 15 },
          { category: "photography", percentage: 5 },
          { category: "invitations", percentage: 2 },
          { category: "miscellaneous", percentage: 3 },
          { category: "contingency", percentage: 5 },
        ];
      case "COMMUNITY":
        return [
          { category: "venue", percentage: 25 },
          { category: "catering", percentage: 25 },
          { category: "entertainment", percentage: 20 },
          { category: "decoration", percentage: 10 },
          { category: "transportation", percentage: 5 },
          { category: "invitations", percentage: 3 },
          { category: "miscellaneous", percentage: 4 },
          { category: "contingency", percentage: 8 },
        ];
    }
  }

  /**
   * Distribute total budget into integer minor units using the Largest Remainder Method (Hare-Niemeyer).
   * This guarantees that sum(categories) === total_minor with ZERO rounding drift!
   */
  static allocateBudget(
    totalMinor: number,
    ratios: CategoryRatio[]
  ): { category: BudgetCategoryName; amount_minor: number }[] {
    if (totalMinor <= 0) {
      return ratios.map((r) => ({ category: r.category, amount_minor: 0 }));
    }

    const totalPercentage = ratios.reduce((sum, r) => sum + r.percentage, 0);
    const rawAllocations = ratios.map((r) => {
      const exact = (totalMinor * r.percentage) / totalPercentage;
      const floor = Math.floor(exact);
      const remainder = exact - floor;
      return {
        category: r.category,
        floor,
        remainder,
      };
    });

    const allocatedSum = rawAllocations.reduce((sum, r) => sum + r.floor, 0);
    let diff = totalMinor - allocatedSum;

    // Sort by largest remainder descending
    const sorted = [...rawAllocations].sort((a, b) => b.remainder - a.remainder);

    // Distribute remaining units
    const addOns = new Map<BudgetCategoryName, number>();
    for (let i = 0; i < diff; i++) {
      const cat = sorted[i % sorted.length].category;
      addOns.set(cat, (addOns.get(cat) || 0) + 1);
    }

    return rawAllocations.map((r) => ({
      category: r.category,
      amount_minor: r.floor + (addOns.get(r.category) || 0),
    }));
  }

  /**
   * Calculate budget summary totals deterministically.
   */
  static calculateSummary(
    totalMinor: number,
    categories: Array<{ estimated_minor: number; actual_minor: number; category: string }>,
    contingencyMinor: number
  ): BudgetSummary {
    const nonContingency = categories.filter((c) => c.category !== "contingency");
    const allocatedMinor = nonContingency.reduce((acc, c) => acc + (c.estimated_minor || 0), 0);
    const actualSpentMinor = categories.reduce((acc, c) => acc + (c.actual_minor || 0), 0);
    
    const remainingMinor = totalMinor - actualSpentMinor;
    const unallocatedMinor = Math.max(0, totalMinor - (allocatedMinor + contingencyMinor));
    const isOverBudget = actualSpentMinor > totalMinor;
    const overspendMinor = isOverBudget ? actualSpentMinor - totalMinor : 0;

    return {
      total_minor: totalMinor,
      allocated_minor: allocatedMinor,
      actual_spent_minor: actualSpentMinor,
      remaining_minor: remainingMinor,
      contingency_minor: contingencyMinor,
      unallocated_minor: unallocatedMinor,
      is_over_budget: isOverBudget,
      overspend_minor: overspendMinor,
    };
  }

  /**
   * Modify a single category allocation and propose redistribution or unallocated adjustment.
   */
  static modifyCategory(
    currentCategories: Array<{ category: BudgetCategoryName; estimated_minor: number }>,
    totalMinor: number,
    targetCategory: BudgetCategoryName,
    newAmountMinor: number
  ): {
    updatedCategories: Array<{ category: BudgetCategoryName; estimated_minor: number }>;
    differenceMinor: number;
    newUnallocatedMinor: number;
  } {
    const updated = currentCategories.map((c) =>
      c.category === targetCategory ? { ...c, estimated_minor: newAmountMinor } : { ...c }
    );

    const newAllocated = updated.reduce((sum, c) => sum + c.estimated_minor, 0);
    const diff = newAllocated - currentCategories.reduce((sum, c) => sum + c.estimated_minor, 0);
    const newUnallocated = Math.max(0, totalMinor - newAllocated);

    return {
      updatedCategories: updated,
      differenceMinor: diff,
      newUnallocatedMinor: newUnallocated,
    };
  }
}
