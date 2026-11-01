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
import { ClientCache } from "@/lib/client-cache";
import { BudgetCategory, Expense } from "@/types";
import {
  Wallet,
  Plus,
  Trash2,
  Sparkles,
  Receipt,
  Loader2,
  ShieldAlert,
} from "lucide-react";

export default function BudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  // Instant SWR cache read
  const cachedBudget = ClientCache.get<any>(`budget_${eventId}`);
  const cachedExpenses = ClientCache.get<Expense[]>(`expenses_${eventId}`);

  const [budgetData, setBudgetData] = useState<any>(cachedBudget);
  const [expenses, setExpenses] = useState<Expense[]>(cachedExpenses || []);
  const [isLoading, setIsLoading] = useState(!cachedBudget);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Expense modal state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [category, setCategory] = useState("catering");
  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirm delete state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchBudget = async () => {
    try {
      const [bRes, eRes] = await Promise.all([
        fetch(`/api/events/${eventId}/budget`),
        fetch(`/api/events/${eventId}/expenses`),
      ]);
      const bJson = await bRes.json();
      const eJson = await eRes.json();

      if (bJson.data) {
        setBudgetData(bJson.data);
        ClientCache.set(`budget_${eventId}`, bJson.data);
      }
      if (eJson.data) {
        setExpenses(eJson.data);
        ClientCache.set(`expenses_${eventId}`, eJson.data);
      }
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
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/events/${eventId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          description,
          actual_minor: Math.round(amountVal * 100),
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        setErrorMsg(j.error?.message || "Failed to record disbursement.");
        return;
      }
      setIsExpenseModalOpen(false);
      setDescription("");
      setAmountStr("");
      ClientCache.invalidate(`budget_${eventId}`);
      ClientCache.invalidate(`dashboard_${eventId}`);
      fetchBudget();
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    setConfirmDeleteId(null);
    try {
      await fetch(`/api/events/${eventId}/expenses?expenseId=${expenseId}`, {
        method: "DELETE",
      });
      ClientCache.invalidate(`budget_${eventId}`);
      ClientCache.invalidate(`dashboard_${eventId}`);
      fetchBudget();
    } catch (e) {
      console.error(e);
    }
  };

  const budget = budgetData?.budget;
  const categories = budgetData?.categories || [];
  const currency = budget?.currency || "INR";
  const totalMinor = budget?.total_minor || 0;

  const totalAllocatedMinor = categories.reduce(
    (acc: number, c: BudgetCategory) => acc + (c.category !== "contingency" ? c.estimated_minor : 0),
    0
  );
  const totalActualSpent = expenses.reduce((acc, e) => acc + e.actual_minor, 0);
  const remainingMinor = totalMinor - totalActualSpent;
  const isOverBudget = remainingMinor < 0;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#05070E]">
      <Navbar onOpenAssistant={() => setIsAssistantOpen(true)} />

      <div className="flex-1 flex">
        <Sidebar eventId={eventId} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#C5A880]">
                  Capital & Disbursements
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Financial Ledger</h1>
              <p className="text-xs text-slate-400 mt-1">
                Precision allocations, quotation balances, and live disbursement tracking.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAssistantOpen(true)}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#C5A880]" />
                <span>Reallocate with Concierge</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsExpenseModalOpen(true)}
                className="gap-2 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Record Disbursement</span>
              </Button>
            </div>
          </div>

          {isLoading && !budgetData ? (
            <div className="space-y-6 animate-pulse">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="h-20 bg-[#0D111A]/80 rounded-2xl border border-white/[0.08]" />
                <div className="h-20 bg-[#0D111A]/80 rounded-2xl border border-white/[0.08]" />
                <div className="h-20 bg-[#0D111A]/80 rounded-2xl border border-white/[0.08]" />
                <div className="h-20 bg-[#0D111A]/80 rounded-2xl border border-white/[0.08]" />
              </div>
              <div className="h-64 bg-[#0D111A]/80 rounded-2xl border border-white/[0.08]" />
            </div>
          ) : (
            <>
              {/* Budget Top Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className="space-y-1 border border-white/[0.08]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Target Capital</span>
                  <div className="text-xl font-bold font-mono text-white">
                    {formatCurrency(totalMinor, currency)}
                  </div>
                </Card>

                <Card className="space-y-1 border border-white/[0.08]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Allocated Sub-Budgets</span>
                  <div className="text-xl font-bold font-mono text-[#E6C79C]">
                    {formatCurrency(totalAllocatedMinor, currency)}
                  </div>
                </Card>

                <Card className="space-y-1 border border-white/[0.08]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Disbursed Capital</span>
                  <div className="text-xl font-bold font-mono text-white">
                    {formatCurrency(totalActualSpent, currency)}
                  </div>
                </Card>

                <Card className="space-y-1 border border-white/[0.08]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Remaining Capital</span>
                  <div
                    className={`text-xl font-bold font-mono ${
                      isOverBudget ? "text-rose-400 font-extrabold" : "text-[#7CE4B5]"
                    }`}
                  >
                    {formatCurrency(remainingMinor, currency)}
                  </div>
                </Card>
              </div>

              {/* Categories Breakdown Table */}
              <Card className="space-y-4 border border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      Category Allocations
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Balanced benchmark allocation matched to target capital
                    </p>
                  </div>
                  <Badge variant="gold">Verified Ledger</Badge>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="pb-3 pl-2">Category</th>
                        <th className="pb-3">Estimated Allocation</th>
                        <th className="pb-3">Disbursed</th>
                        <th className="pb-3 pr-2">Remaining</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {categories.map((c: BudgetCategory) => {
                        const diff = c.estimated_minor - c.actual_minor;
                        const isCategoryOver = diff < 0;

                        return (
                          <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 pl-2 capitalize font-semibold text-slate-200">
                              {c.category}
                            </td>
                            <td className="py-3 font-mono text-[#E6C79C] font-medium">
                              {formatCurrency(c.estimated_minor, currency)}
                            </td>
                            <td className="py-3 font-mono text-slate-300">
                              {formatCurrency(c.actual_minor, currency)}
                            </td>
                            <td
                              className={`py-3 pr-2 font-mono font-medium ${
                                isCategoryOver ? "text-rose-400" : "text-[#7CE4B5]"
                              }`}
                            >
                              {formatCurrency(diff, currency)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Expense Log */}
              <Card className="space-y-4 border border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#C5A880]" />
                    <span>Recorded Disbursements ({expenses.length})</span>
                  </h2>
                  <Button size="sm" variant="outline" onClick={() => setIsExpenseModalOpen(true)}>
                    Add Record
                  </Button>
                </div>

                {expenses.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400">
                    No disbursements recorded yet. Click &ldquo;Record Disbursement&rdquo; to log advance or final payments.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/[0.08] text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                          <th className="pb-3 pl-2">Description</th>
                          <th className="pb-3">Category</th>
                          <th className="pb-3">Amount Paid</th>
                          <th className="pb-3">Date</th>
                          <th className="pb-3 pr-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {expenses.map((e) => (
                          <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 pl-2 font-medium text-slate-200">{e.description}</td>
                            <td className="py-3 capitalize text-slate-400">{e.category}</td>
                            <td className="py-3 font-mono font-semibold text-white">
                              {formatCurrency(e.actual_minor, e.currency)}
                            </td>
                            <td className="py-3 text-slate-400">{formatDate(e.created_at)}</td>
                            <td className="py-3 pr-2 text-right">
                              {confirmDeleteId === e.id ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleDeleteExpense(e.id)}
                                    className="text-[11px] text-rose-400 font-semibold hover:text-rose-300 px-2 py-0.5"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="text-[11px] text-slate-500 hover:text-slate-300"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteId(e.id)}
                                  className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                                  aria-label="Delete disbursement"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </>
          )}
        </main>
      </div>

      {/* Record Expense Modal */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => { setIsExpenseModalOpen(false); setErrorMsg(null); }}
        title="Record New Disbursement"
        description="Add a verified partner advance or invoice payment to deduct from budget."
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          {errorMsg && (
            <div className="text-xs text-rose-300 bg-rose-950/60 border border-rose-800/80 rounded-xl px-3.5 py-2">
              {errorMsg}
            </div>
          )}
          <Input
            label="Description"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. 20% Advance for Banquet Booking"
          />

          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium tracking-wider uppercase text-slate-300">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#101217] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-[#C5A880]"
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
            label={`Amount Disbursed (${currency})`}
            type="number"
            required
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            placeholder="e.g. 50000"
          />

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="ghost" type="button" onClick={() => { setIsExpenseModalOpen(false); setErrorMsg(null); }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Save Disbursement
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
