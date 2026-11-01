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
import { ClientCache } from "@/lib/client-cache";
import {
  Sparkles,
  Calendar,
  Users,
  MapPin,
  Wallet,
  CheckCircle2,
  ArrowRight,
  Clock,
  CheckSquare,
  ShieldAlert,
  Loader2,
  Compass,
} from "lucide-react";

export default function EventDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  // Instant SWR cache read
  const cachedData = ClientCache.get<DashboardProjection>(`dashboard_${eventId}`);
  const [data, setData] = useState<DashboardProjection | null>(cachedData);
  const [isLoading, setIsLoading] = useState(!cachedData);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/dashboard`);
      const json = await res.json();
      if (json.data) {
        setData(json.data);
        ClientCache.set(`dashboard_${eventId}`, json.data);
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
    // Optimistic update
    if (data) {
      const updatedTasks = data.timeline.tasks.map((t) =>
        t.id === taskId ? { ...t, status: newStatus as any } : t
      );
      const completedCount = updatedTasks.filter((t) => t.status === "COMPLETED").length;
      const updated = {
        ...data,
        timeline: {
          ...data.timeline,
          tasks: updatedTasks,
          completed_task_count: completedCount,
        },
      };
      setData(updated);
      ClientCache.set(`dashboard_${eventId}`, updated);
    }

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

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#05070E]">
      <Navbar eventName={data?.event?.name} onOpenAssistant={() => setIsAssistantOpen(true)} />

      <div className="flex-1 flex">
        <Sidebar eventId={eventId} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {isLoading && !data ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-32 bg-[#0D111A]/80 rounded-2xl border border-white/[0.08]" />
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="h-24 bg-[#0D111A]/80 rounded-2xl border border-white/[0.08]" />
                <div className="h-24 bg-[#0D111A]/80 rounded-2xl border border-white/[0.08]" />
                <div className="h-24 bg-[#0D111A]/80 rounded-2xl border border-white/[0.08]" />
                <div className="h-24 bg-[#0D111A]/80 rounded-2xl border border-white/[0.08]" />
              </div>
            </div>
          ) : !data ? (
            <Card className="text-center p-8 space-y-4 max-w-md mx-auto border border-white/10">
              <h2 className="text-lg font-bold text-white">Commission Not Found</h2>
              <Link href="/events">
                <Button variant="primary">Return to Portfolio</Button>
              </Link>
            </Card>
          ) : (
            <>
              {/* Header Card */}
              <div className="glass-card rounded-2xl p-6 sm:p-8 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-white/[0.08]">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <Badge variant={data.event.event_type === "WEDDING" ? "gold" : "amber"}>
                      {data.event.event_type}
                    </Badge>
                    <span className="text-[11px] text-[#C5A880] tracking-wider uppercase font-semibold">
                      {data.event.style || "Modern Traditional"}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {data.event.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-400 pt-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#C5A880]" />
                      <span className="text-slate-200 font-medium">{formatDate(data.event.date)}</span>
                      {getDaysRemaining(data.event.date) !== null && (
                        <span className="text-[#C5A880] font-semibold">({getDaysRemaining(data.event.date)} days remaining)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-rose-400" />
                      <span className="text-slate-200">{data.event.city}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#8EB8E5]" />
                      <span className="font-semibold text-slate-100">{data.event.guest_count} Confirmed Guests</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  onClick={() => setIsAssistantOpen(true)}
                  className="gap-2 shadow-xl shrink-0"
                >
                  <Sparkles className="w-4 h-4 text-[#0A0B0E]" />
                  <span>Consult Concierge</span>
                </Button>
              </div>

              {/* Overspend Warning Banner */}
              {data.budget.is_over_budget && (
                <div className="bg-rose-950/60 border border-rose-800/80 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs text-rose-200 animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                    <div>
                      <span className="font-bold">Budget Variance Notice:</span> Actual commitments exceed target allocation by{" "}
                      <span className="font-mono font-bold text-rose-300">
                        {formatCurrency(data.budget.actual_spent_minor - data.budget.total_minor, data.budget.currency)}
                      </span>
                      . Consult your concierge to rebalance categories or release reserve funds.
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAssistantOpen(true)}
                    className="shrink-0 text-rose-300 border-rose-700/80 hover:bg-rose-900/40"
                  >
                    Rebalance
                  </Button>
                </div>
              )}

              {/* Executive Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Budget */}
                <Card className="space-y-2 border border-white/[0.08]">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold tracking-wider uppercase">
                    <span>Target Capital</span>
                    <Wallet className="w-4 h-4 text-[#C5A880]" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-white">
                    {formatCurrency(data.budget.total_minor, data.budget.currency)}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Allocated: <span className="text-slate-200 font-mono">{formatCurrency(data.budget.allocated_minor, data.budget.currency)}</span>
                  </p>
                </Card>

                {/* Spent & Remaining */}
                <Card className="space-y-2 border border-white/[0.08]">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold tracking-wider uppercase">
                    <span>Disbursed Capital</span>
                    <span className={`text-[11px] font-bold ${data.budget.remaining_minor < 0 ? "text-rose-400" : "text-[#C5A880]"}`}>
                      {data.budget.total_minor > 0
                        ? Math.min(100, Math.round((data.budget.actual_spent_minor / data.budget.total_minor) * 100))
                        : 0}% utilized
                    </span>
                  </div>
                  <div
                    className={`text-2xl font-bold font-mono ${
                      data.budget.remaining_minor < 0 ? "text-rose-400" : "text-[#7CE4B5]"
                    }`}
                  >
                    {formatCurrency(data.budget.remaining_minor, data.budget.currency)}
                  </div>
                  <div className="w-full bg-[#181A22] rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${data.budget.is_over_budget ? "bg-rose-500" : "bg-gradient-to-r from-[#C5A880] to-[#E6C79C]"}`}
                      style={{
                        width: `${data.budget.total_minor > 0
                          ? Math.min(100, Math.round((data.budget.actual_spent_minor / data.budget.total_minor) * 100))
                          : 0}%`
                      }}
                    />
                  </div>
                </Card>

                {/* Tasks Progress */}
                <Card className="space-y-2 border border-white/[0.08]">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold tracking-wider uppercase">
                    <span>Itinerary Milestones</span>
                    <CheckSquare className="w-4 h-4 text-[#8EB8E5]" />
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {data.timeline.completed_task_count} / {data.timeline.total_task_count}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {data.timeline.overdue_task_count > 0 ? (
                      <span className="text-rose-400 font-semibold">{data.timeline.overdue_task_count} overdue</span>
                    ) : (
                      <span className="text-[#7CE4B5]">All milestones on schedule</span>
                    )}
                  </p>
                </Card>

                {/* Vendors Summary */}
                <Card className="space-y-2 border border-white/[0.08]">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold tracking-wider uppercase">
                    <span>Vendor Directory</span>
                    <Users className="w-4 h-4 text-[#7CE4B5]" />
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {data.vendors.checklist.length} Categories
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Quoted: <span className="text-slate-200">{formatCurrency(data.vendors.total_quoted_minor, data.budget.currency)}</span>
                  </p>
                </Card>
              </div>

              {/* Two-Column Working Area */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Budget Allocations & Priority Tasks */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Category Breakdown */}
                  <Card className="space-y-4 border border-white/[0.08]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                          Financial Allocations
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Sub-budget allocations matching target capital with zero drift
                        </p>
                      </div>
                      <Link href={`/events/${eventId}/budget`}>
                        <Button size="sm" variant="outline" className="text-xs">
                          Ledger View
                        </Button>
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {data.budget.categories.slice(0, 6).map((c) => (
                        <div
                          key={c.id}
                          className="p-3.5 rounded-xl bg-[#0D111A] border border-white/[0.08] flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="capitalize font-semibold text-slate-200">{c.category}</span>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              Disbursed: {formatCurrency(c.actual_minor, data.budget.currency)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-[#E6C79C]">
                              {formatCurrency(c.estimated_minor, data.budget.currency)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Tasks Checklist */}
                  <Card className="space-y-4 border border-white/[0.08]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                          Priority Action Items
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">Check tasks off as you complete them</p>
                      </div>
                      <Link href={`/events/${eventId}/timeline`}>
                        <Button size="sm" variant="outline" className="text-xs">
                          Full Schedule ({data.timeline.total_task_count})
                        </Button>
                      </Link>
                    </div>

                    <div className="space-y-2.5">
                      {data.timeline.tasks.slice(0, 5).map((t) => {
                        const isDone = t.status === "COMPLETED";
                        return (
                          <div
                            key={t.id}
                            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                              isDone
                                ? "bg-[#0A0B0E]/40 border-white/[0.04] text-slate-500"
                                : "bg-[#0D111A] border-white/[0.08] text-slate-200 hover:border-[#C5A880]/30"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isDone}
                                onChange={() => handleToggleTask(t.id, t.status)}
                                className="w-4 h-4 rounded border-white/20 bg-[#14161C] text-[#C5A880] focus:ring-[#C5A880] cursor-pointer"
                              />
                              <div>
                                <span className={`font-medium ${isDone ? "line-through text-slate-500" : "text-white"}`}>
                                  {t.title}
                                </span>
                                {t.due_at && (
                                  <p className="text-[11px] text-slate-400 mt-0.5">Target: {formatDate(t.due_at)}</p>
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

                {/* Right Column: Curated Concepts & Timeline Milestones */}
                <div className="space-y-6">
                  {/* Curated Concepts */}
                  <Card className="space-y-3.5 bg-[#121622] border-[#C5A880]/25">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-bold text-[#E6C79C]">
                        <Sparkles className="w-4 h-4 text-[#C5A880]" />
                        <span>Curated Concepts</span>
                      </div>
                      <Link href={`/events/${eventId}/ideas`}>
                        <Button size="sm" variant="ghost" className="text-xs text-[#E6C79C] hover:text-white">
                          Lookbook
                        </Button>
                      </Link>
                    </div>

                    <div className="space-y-3">
                      {data.recommendations.slice(0, 3).map((idea) => (
                        <div
                          key={idea.id}
                          className="p-3.5 rounded-xl bg-[#0D111A]/90 border border-white/[0.08] space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-200">{idea.title}</span>
                            <Badge variant="gold">{idea.kind}</Badge>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed font-light">{idea.description}</p>
                          {idea.cost_range && (
                            <p className="text-[10px] text-[#7CE4B5] font-mono">Estimated: {idea.cost_range}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Milestones Road */}
                  <Card className="space-y-3.5 border border-white/[0.08]">
                    <div className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
                      <span>Milestone Deadlines</span>
                      <Calendar className="w-4 h-4 text-[#C5A880]" />
                    </div>
                    <div className="space-y-2.5">
                      {data.timeline.milestones.slice(0, 4).map((m) => (
                        <div
                          key={m.id}
                          className="p-3 rounded-xl bg-[#0D111A] border border-white/[0.08] text-xs flex items-center justify-between"
                        >
                          <span className="text-slate-200 font-medium truncate max-w-[180px]">{m.title}</span>
                          <span className="font-mono text-[#E6C79C] text-[11px] shrink-0">{formatDate(m.due_at)}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Floating Concierge Drawer */}
      <AssistantDrawer
        eventId={eventId}
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onDataChanged={fetchDashboard}
        currency={data?.budget?.currency}
      />
    </div>
  );
}
