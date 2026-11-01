"use client";

import React, { useState, useEffect, use } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { AssistantDrawer } from "@/components/ai/AssistantDrawer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BudgetCategory, Expense } from "@/types";
import {
  Wallet,
  Plus,
  Trash2,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Receipt,
  Loader2,
} from "lucide-react";

export default function BudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [budgetData, setBudgetData] = useState<any>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Expense modal state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [category, setCategory] = useState("catering");
  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBudget = async () => {
    try {
      const [bRes, eRes] = await Promise.all([
        fetch(`/api/events/${eventId}/budget`),
        fetch(`/api/events/${eventId}/expenses`),
      ]);
      const bJson = await bRes.json();
      const eJson = await eRes.json();

      if (bJson.data) setBudgetData(bJson.data);
      if (eJson.data) setExpenses(eJson.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, [eventId]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(amountStr.replace(/,/g, ""));
    if (isNaN(amountVal) || amountVal <= 0) return;

    setIsSubmitting(true);
    try {
      await fetch(`/api/events/${eventId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          description,
          actual_minor: Math.round(amountVal * 100),
        }),
      });

      setIsExpenseModalOpen(false);
      setDescription("");
      setAmountStr("");
      fetchBudget();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await fetch(`/api/events/${eventId}/expenses?expenseId=${expenseId}`, {
        method: "DELETE",
      });
      fetchBudget();
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading || !budgetData) {
    return (
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      </div>
    );
  }

  const { budget, categories } = budgetData;
  const totalMinor = budget?.total_minor || 0;
  const contingencyMinor = budget?.contingency_minor || 0;

  const totalAllocatedMinor = categories.reduce(
    (acc: number, c: BudgetCategory) => acc + (c.category !== "contingency" ? c.estimated_minor : 0),
    0
  );
  const totalActualSpent = expenses.reduce((acc, e) => acc + e.actual_minor, 0);
  const remainingMinor = totalMinor - totalActualSpent;
  const isOverBudget = remainingMinor < 0;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar onOpenAssistant={() => setIsAssistantOpen(true)} />

      <div className="flex-1 flex">
        <Sidebar eventId={eventId} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Budget & Expense Manager</h1>
              <p className="text-xs text-slate-400 mt-1">
                Zero-drift integer budget allocations, live quotation comparisons, and expense records
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAssistantOpen(true)}
                className="gap-2 text-purple-300 border-purple-800"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Reallocate with AI</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsExpenseModalOpen(true)}
                className="gap-2 shadow-purple-900/40"
              >
                <Plus className="w-4 h-4" />
                <span>Record Expense</span>
              </Button>
            </div>
          </div>

          {/* Budget Top Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="space-y-1">
              <span className="text-xs text-slate-400 font-medium">Total Target Budget</span>
              <div className="text-xl font-bold font-mono text-slate-100">
                {formatCurrency(totalMinor, budget?.currency)}
              </div>
            </Card>

            <Card className="space-y-1">
              <span className="text-xs text-slate-400 font-medium">Allocated Categories</span>
              <div className="text-xl font-bold font-mono text-purple-300">
                {formatCurrency(totalAllocatedMinor, budget?.currency)}
              </div>
            </Card>

            <Card className="space-y-1">
              <span className="text-xs text-slate-400 font-medium">Actual Spent</span>
              <div className="text-xl font-bold font-mono text-slate-100">
                {formatCurrency(totalActualSpent, budget?.currency)}
              </div>
            </Card>

            <Card className="space-y-1">
              <span className="text-xs text-slate-400 font-medium">Remaining Balance</span>
              <div
                className={`text-xl font-bold font-mono ${
                  isOverBudget ? "text-rose-400 font-extrabold" : "text-emerald-300"
                }`}
              >
                {formatCurrency(remainingMinor, budget?.currency)}
              </div>
            </Card>
          </div>

          {/* Categories Breakdown Table */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Category Allocations (Benchmark Model)
              </h2>
              <Badge variant="purple">Deterministic Precision</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 pl-2">Category</th>
                    <th className="pb-3">Estimated Allocation</th>
                    <th className="pb-3">Actual Spent</th>
                    <th className="pb-3">Remaining</th>
                    <th className="pb-3 pr-2">Provenance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {categories.map((c: BudgetCategory) => {
                    const diff = c.estimated_minor - c.actual_minor;
                    const isCategoryOver = diff < 0;

                    return (
                      <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 pl-2 capitalize font-semibold text-slate-200">
                          {c.category}
                        </td>
                        <td className="py-3 font-mono text-purple-300 font-medium">
                          {formatCurrency(c.estimated_minor, budget?.currency)}
                        </td>
                        <td className="py-3 font-mono text-slate-300">
                          {formatCurrency(c.actual_minor, budget?.currency)}
                        </td>
                        <td
                          className={`py-3 font-mono font-medium ${
                            isCategoryOver ? "text-rose-400" : "text-emerald-400"
                          }`}
                        >
                          {formatCurrency(diff, budget?.currency)}
                        </td>
                        <td className="py-3 pr-2">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                            {c.source}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Expense Log */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-purple-400" />
                <span>Recorded Expenses ({expenses.length})</span>
              </h2>
              <Button size="sm" variant="outline" onClick={() => setIsExpenseModalOpen(true)}>
                Add Receipt
              </Button>
            </div>

            {expenses.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No actual expenses recorded yet. Click &quot;Record Expense&quot; to log advance or final payments.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="pb-3 pl-2">Description</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Amount Paid</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3 pr-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {expenses.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 pl-2 font-medium text-slate-200">{e.description}</td>
                        <td className="py-3 capitalize text-slate-400">{e.category}</td>
                        <td className="py-3 font-mono font-semibold text-slate-100">
                          {formatCurrency(e.actual_minor, e.currency)}
                        </td>
                        <td className="py-3 text-slate-400">{formatDate(e.created_at)}</td>
                        <td className="py-3 pr-2 text-right">
                          <button
                            onClick={() => handleDeleteExpense(e.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                            aria-label="Delete expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </main>
      </div>

      {/* Record Expense Modal */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Record New Expense"
        description="Add a verified quotation advance or invoice payment to deduct from budget."
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          <Input
            label="Description"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. 20% Advance for Banquet Hall Booking"
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-slate-100"
            >
              <option value="venue">Venue</option>
              <option value="catering">Catering</option>
              <option value="decoration">Decoration</option>
              <option value="photography">Photography</option>
              <option value="entertainment">Entertainment</option>
              <option value="transportation">Transportation</option>
              <option value="invitations">Invitations</option>
              <option value="miscellaneous">Miscellaneous</option>
            </select>
          </div>

          <Input
            label="Amount Paid (in INR)"
            type="number"
            required
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            placeholder="e.g. 50000"
          />

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="ghost" type="button" onClick={() => setIsExpenseModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>

      <AssistantDrawer
        eventId={eventId}
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onDataChanged={fetchBudget}
      />
    </div>
  );
}
