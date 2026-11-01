import crypto from "crypto";
import { query, queryOne, execute, transaction } from "@/lib/db";
import { Budget, BudgetCategory, Expense, BudgetCategoryName, ProvenanceSource } from "@/types";

export class BudgetRepo {
  static createOrUpdateBudget(
    eventId: string,
    totalMinor: number,
    currency = "INR",
    contingencyMinor = 0
  ): Budget {
    const existing = queryOne<Budget>("SELECT * FROM budgets WHERE event_id = ?", [eventId]);
    if (existing) {
      execute(
        "UPDATE budgets SET total_minor = ?, currency = ?, contingency_minor = ? WHERE id = ?",
        [totalMinor, currency, contingencyMinor, existing.id]
      );
      return queryOne<Budget>("SELECT * FROM budgets WHERE id = ?", [existing.id])!;
    }

    const id = crypto.randomUUID();
    execute(
      "INSERT INTO budgets (id, event_id, total_minor, currency, contingency_minor) VALUES (?, ?, ?, ?, ?)",
      [id, eventId, totalMinor, currency, contingencyMinor]
    );
    return queryOne<Budget>("SELECT * FROM budgets WHERE id = ?", [id])!;
  }

  static getBudgetByEventId(eventId: string): Budget | null {
    return queryOne<Budget>("SELECT * FROM budgets WHERE event_id = ?", [eventId]);
  }

  static setCategories(
    budgetId: string,
    categories: Array<{
      category: BudgetCategoryName;
      estimated_minor: number;
      actual_minor?: number;
      source?: ProvenanceSource;
      locked?: boolean;
    }>
  ) {
    transaction(() => {
      // Clear existing categories for clean sync
      execute("DELETE FROM budget_categories WHERE budget_id = ?", [budgetId]);

      for (const cat of categories) {
        const id = crypto.randomUUID();
        execute(
          `INSERT INTO budget_categories (id, budget_id, category, estimated_minor, actual_minor, source, locked)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            budgetId,
            cat.category,
            cat.estimated_minor,
            cat.actual_minor || 0,
            cat.source || "ai_generated",
            cat.locked ? 1 : 0,
          ]
        );
      }
    });
  }

  static getCategories(budgetId: string): BudgetCategory[] {
    const rows = query<any>("SELECT * FROM budget_categories WHERE budget_id = ? ORDER BY estimated_minor DESC", [budgetId]);
    return rows.map((r) => ({
      ...r,
      locked: Boolean(r.locked),
    }));
  }

  static updateCategoryAmount(
    budgetId: string,
    category: BudgetCategoryName,
    estimatedMinor: number,
    source: ProvenanceSource = "user_entered"
  ) {
    execute(
      "UPDATE budget_categories SET estimated_minor = ?, source = ? WHERE budget_id = ? AND category = ?",
      [estimatedMinor, source, budgetId, category]
    );
  }

  static addExpense(data: {
    eventId: string;
    category: BudgetCategoryName;
    description: string;
    estimatedMinor?: number;
    actualMinor: number;
    currency?: string;
    status?: "PLANNED" | "PENDING" | "PAID";
  }): Expense {
    const id = crypto.randomUUID();
    execute(
      `INSERT INTO expenses (id, event_id, category, description, estimated_minor, actual_minor, currency, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.eventId,
        data.category,
        data.description,
        data.estimatedMinor || 0,
        data.actualMinor,
        data.currency || "INR",
        data.status || "PAID",
      ]
    );

    // Also update actual_minor on the matching budget_category if exists
    const budget = queryOne<Budget>("SELECT id FROM budgets WHERE event_id = ?", [data.eventId]);
    if (budget) {
      execute(
        `UPDATE budget_categories 
         SET actual_minor = (SELECT COALESCE(SUM(actual_minor), 0) FROM expenses WHERE event_id = ? AND category = ?)
         WHERE budget_id = ? AND category = ?`,
        [data.eventId, data.category, budget.id, data.category]
      );
    }

    return queryOne<Expense>("SELECT * FROM expenses WHERE id = ?", [id])!;
  }

  static getExpensesByEventId(eventId: string): Expense[] {
    return query<Expense>(
      "SELECT * FROM expenses WHERE event_id = ? ORDER BY created_at DESC",
      [eventId]
    );
  }

  static deleteExpense(expenseId: string, eventId: string): boolean {
    const res = execute("DELETE FROM expenses WHERE id = ? AND event_id = ?", [expenseId, eventId]);
    return res.changes > 0;
  }
}
