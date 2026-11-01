import { ActionProposal, EventItem, BudgetCategory, Task, BudgetCategoryName } from "@/types";
import { formatCurrency } from "@/lib/utils";

export interface ImpactAnalysisResult {
  proposal: ActionProposal;
  isDestructive: boolean;
  warnings: string[];
}

export class ModificationService {
  /**
   * Deterministically analyze the impact of increasing or decreasing guest count
   */
  static analyzeGuestCountChange(
    event: EventItem,
    currentCategories: BudgetCategory[],
    newGuestCount: number,
    preserveTotalBudget = true
  ): ImpactAnalysisResult {
    const oldGuests = event.guest_count || 1;
    const ratio = newGuestCount / oldGuests;
    const warnings: string[] = [];

    if (newGuestCount > oldGuests * 1.3) {
      warnings.push(`Guest count increased by ${Math.round((ratio - 1) * 100)}%. Ensure the venue can accommodate ${newGuestCount} guests.`);
    }

    // Catering is directly variable with guests
    const cateringCat = currentCategories.find((c) => c.category === "catering");
    const oldCateringMinor = cateringCat ? cateringCat.estimated_minor : 0;
    const oldPerGuest = Math.round(oldCateringMinor / oldGuests);

    // If preserving budget, we propose shifting funds from decor/miscellaneous or warning user
    let newCateringMinor = Math.round(oldPerGuest * newGuestCount);
    let budgetChangeMinor = 0;
    const operations: any[] = [];
    const affectedCategories: string[] = ["catering"];

    if (preserveTotalBudget) {
      const extraCateringNeeded = newCateringMinor - oldCateringMinor;
      if (extraCateringNeeded > 0) {
        warnings.push(
          `Catering requires an estimated ${formatCurrency(extraCateringNeeded, event.currency)} additional funds. Reallocating from decoration and contingency to keep the budget steady.`
        );
        // Find decor and contingency to reduce
        const decorCat = currentCategories.find((c) => c.category === "decoration");
        const decorReduction = decorCat ? Math.min(decorCat.estimated_minor * 0.4, extraCateringNeeded * 0.7) : 0;
        const remainderToTake = extraCateringNeeded - decorReduction;

        if (decorCat && decorReduction > 0) {
          operations.push({
            op: "set_budget_category",
            params: {
              category: "decoration",
              amount_minor: Math.round(decorCat.estimated_minor - decorReduction),
            },
          });
          affectedCategories.push("decoration");
        }

        operations.push({
          op: "set_budget_category",
          params: {
            category: "catering",
            amount_minor: newCateringMinor,
          },
        });
      }
    } else {
      budgetChangeMinor = newCateringMinor - oldCateringMinor;
      operations.push({
        op: "set_budget_category",
        params: {
          category: "catering",
          amount_minor: newCateringMinor,
        },
      });
    }

    operations.push({
      op: "adjust_guest_count",
      params: {
        guest_count: newGuestCount,
      },
    });

    const proposal: ActionProposal = {
      intent: "UPDATE_EVENT",
      confidence: 0.95,
      requires_confirmation: true,
      message: `Adjusting guest count from ${oldGuests} to ${newGuestCount}.${
        preserveTotalBudget ? " Reallocating budget to maintain your total budget." : ""
      }`,
      impact_summary: {
        budget_change_minor: budgetChangeMinor,
        affected_categories: affectedCategories,
        affected_milestones: ["Venue & Catering Finalized"],
        warnings,
      },
      operations,
    };

    return {
      proposal,
      isDestructive: false,
      warnings,
    };
  }

  /**
   * Analyze budget category reallocation
   */
  static analyzeBudgetReduction(
    category: BudgetCategoryName,
    currentMinor: number,
    reductionMinor: number,
    currency = "INR"
  ): ActionProposal {
    const newAmount = Math.max(0, currentMinor - reductionMinor);
    const savedAmount = currentMinor - newAmount;

    return {
      intent: "UPDATE_BUDGET",
      confidence: 0.98,
      requires_confirmation: true,
      message: `Reduce ${category} budget by ${formatCurrency(savedAmount, currency)}. The saved amount will be added to unallocated contingency.`,
      impact_summary: {
        budget_change_minor: -savedAmount,
        affected_categories: [category, "contingency"],
        affected_milestones: [],
        warnings: [
          `Vendors or items under ${category} should be adjusted to fit within ${formatCurrency(newAmount, currency)}.`,
        ],
      },
      operations: [
        {
          op: "set_budget_category",
          params: {
            category,
            amount_minor: newAmount,
          },
        },
      ],
    };
  }
}
