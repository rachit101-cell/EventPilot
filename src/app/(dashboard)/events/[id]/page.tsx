"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { AssistantDrawer } from "@/components/ai/AssistantDrawer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DashboardProjection } from "@/types";
import { formatCurrency, formatDate, getDaysRemaining } from "@/lib/utils";
import {
  Sparkles,
  Calendar,
  Users,
  MapPin,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckSquare,
  ShieldAlert,
  Loader2,
  TrendingDown,
} from "lucide-react";

export default function EventDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [data, setData] = useState<DashboardProjection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/dashboard`);
      const json = await res.json();
      if (json.data) {
        setData(json.data);
      }
    } catch (e) {
      console.error("Dashboard error", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [eventId]);

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "COMPLETED" ? "TODO" : "COMPLETED";
    try {
      await fetch(`/api/events/${eventId}/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: newStatus }),
      });
      fetchDashboard();
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="text-center p-8 space-y-3">
            <h2 className="text-lg font-bold text-slate-100">Event Not Found</h2>
            <Link href="/events">
              <Button variant="primary">Return to Events</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const { event, budget, timeline, vendors, recommendations } = data;
  const daysLeft = getDaysRemaining(event.date);

  const budgetSpentPct = budget.total_minor > 0
    ? Math.min(100, Math.round((budget.actual_spent_minor / budget.total_minor) * 100))
    : 0;

  const tasksPct = timeline.total_task_count > 0
    ? Math.round((timeline.completed_task_count / timeline.total_task_count) * 100)
    : 0;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar eventName={event.name} onOpenAssistant={() => setIsAssistantOpen(true)} />

      <div className="flex-1 flex">
        <Sidebar eventId={eventId} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Card */}
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Badge variant={event.event_type === "WEDDING" ? "purple" : "amber"}>
                  {event.event_type}
                </Badge>
                <span className="text-xs text-slate-400 font-medium">{event.style || "Modern Traditional"}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
                {event.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  <span>{formatDate(event.date)}</span>
                  {daysLeft !== null && (
                    <span className="text-purple-300 font-medium">({daysLeft} days left)</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{event.city}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-semibold text-slate-200">{event.guest_count} Guests</span>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={() => setIsAssistantOpen(true)}
              className="gap-2 shadow-lg shadow-purple-900/40 shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Modify Plan with AI</span>
            </Button>
          </div>

          {/* Overspend Warning Banner */}
          {budget.is_over_budget && (
            <div className="bg-rose-950/40 border border-rose-800/80 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-rose-200 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <span className="font-bold">Overspend Warning:</span> Actual spend exceeds total budget by{" "}
                  <span className="font-mono font-bold text-rose-300">
                    {formatCurrency(budget.actual_spent_minor - budget.total_minor, budget.currency)}
                  </span>
                  . Consider reducing decoration or using contingency.
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAssistantOpen(true)}
                className="shrink-0 text-rose-300 border-rose-700 hover:bg-rose-900/30"
              >
                Auto-Balance
              </Button>
            </div>
          )}

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Budget */}
            <Card className="space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Total Budget</span>
                <Wallet className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-100">
                {formatCurrency(budget.total_minor, budget.currency)}
              </div>
              <p className="text-[11px] text-slate-400">
                Allocated: {formatCurrency(budget.allocated_minor, budget.currency)}
              </p>
            </Card>

            {/* Spent & Remaining */}
            <Card className="space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Remaining Balance</span>
                <span className={`text-[11px] font-bold ${budget.remaining_minor < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                  {budgetSpentPct}% spent
                </span>
              </div>
              <div
                className={`text-xl font-bold font-mono ${
                  budget.remaining_minor < 0 ? "text-rose-400" : "text-emerald-300"
                }`}
              >
                {formatCurrency(budget.remaining_minor, budget.currency)}
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${budget.is_over_budget ? "bg-rose-500" : "bg-purple-500"}`}
                  style={{ width: `${budgetSpentPct}%` }}
                />
              </div>
            </Card>

            {/* Tasks Progress */}
            <Card className="space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Preparation Tasks</span>
                <CheckSquare className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-xl font-bold text-slate-100">
                {timeline.completed_task_count} / {timeline.total_task_count}
              </div>
              <p className="text-[11px] text-slate-400">
                {timeline.overdue_task_count > 0 ? (
                  <span className="text-rose-400 font-semibold">{timeline.overdue_task_count} overdue</span>
                ) : (
                  <span className="text-emerald-400">All tasks on schedule</span>
                )}
              </p>
            </Card>

            {/* Vendors Summary */}
            <Card className="space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Vendor Checklist</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-slate-100">
                {vendors.checklist.length} Roles
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Quoted: {formatCurrency(vendors.total_quoted_minor, budget.currency)}
              </p>
            </Card>
          </div>

          {/* Two-Column Working Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Budget Allocations & Priority Tasks */}
            <div className="lg:col-span-2 space-y-6">
              {/* Category Breakdown */}
              <Card className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                      Budget Allocations (Benchmark Ratios)
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Deterministic allocation matching confirmed total with 0 drift
                    </p>
                  </div>
                  <Link href={`/events/${eventId}/budget`}>
                    <Button size="sm" variant="outline" className="text-xs">
                      View Details
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {budget.categories.slice(0, 6).map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="capitalize font-semibold text-slate-200">{c.category}</span>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Spent: {formatCurrency(c.actual_minor, budget.currency)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-purple-300">
                          {formatCurrency(c.estimated_minor, budget.currency)}
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">{c.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Tasks Checklist */}
              <Card className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                      Actionable Milestones & Tasks
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Checked tasks update instantly in database</p>
                  </div>
                  <Link href={`/events/${eventId}/timeline`}>
                    <Button size="sm" variant="outline" className="text-xs">
                      All Tasks ({timeline.total_task_count})
                    </Button>
                  </Link>
                </div>

                <div className="space-y-2">
                  {timeline.tasks.slice(0, 5).map((t) => {
                    const isDone = t.status === "COMPLETED";
                    return (
                      <div
                        key={t.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                          isDone
                            ? "bg-slate-900/30 border-slate-800/50 text-slate-500"
                            : "bg-slate-900/70 border-slate-800 text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => handleToggleTask(t.id, t.status)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                          <div>
                            <span className={`font-medium ${isDone ? "line-through text-slate-500" : ""}`}>
                              {t.title}
                            </span>
                            {t.due_at && (
                              <p className="text-[11px] text-slate-400 mt-0.5">Due: {formatDate(t.due_at)}</p>
                            )}
                          </div>
                        </div>

                        <Badge
                          variant={
                            t.priority === "URGENT"
                              ? "rose"
                              : t.priority === "HIGH"
                              ? "amber"
                              : "slate"
                          }
                        >
                          {t.priority}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Right Column: Personalized Ideas & Timeline Milestones */}
            <div className="space-y-6">
              {/* Personalized Ideas */}
              <Card className="space-y-3 bg-purple-950/20 border-purple-900/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-purple-300">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Personalized Event Ideas</span>
                  </div>
                  <Link href={`/events/${eventId}/ideas`}>
                    <Button size="sm" variant="ghost" className="text-xs text-purple-300">
                      Explore
                    </Button>
                  </Link>
                </div>

                <div className="space-y-3">
                  {recommendations.slice(0, 3).map((idea) => (
                    <div
                      key={idea.id}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">{idea.title}</span>
                        <Badge variant="purple">{idea.kind}</Badge>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{idea.description}</p>
                      {idea.cost_range && (
                        <p className="text-[10px] text-emerald-400 font-mono">Estimated: {idea.cost_range}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Milestones Road */}
              <Card className="space-y-3">
                <div className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center justify-between">
                  <span>Milestone Deadlines</span>
                  <Calendar className="w-4 h-4 text-purple-400" />
                </div>
                <div className="space-y-2.5">
                  {timeline.milestones.slice(0, 4).map((m) => (
                    <div
                      key={m.id}
                      className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 text-xs flex items-center justify-between"
                    >
                      <span className="text-slate-200 font-medium truncate max-w-[180px]">{m.title}</span>
                      <span className="font-mono text-purple-300 text-[11px] shrink-0">{formatDate(m.due_at)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Floating AI Trigger & Assistant Drawer */}
      <AssistantDrawer
        eventId={eventId}
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onDataChanged={fetchDashboard}
        currency={budget.currency}
      />
    </div>
  );
}
