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
import { formatDate } from "@/lib/utils";
import { ClientCache } from "@/lib/client-cache";
import { Task, TimelineMilestone, TaskStatus, DashboardProjection } from "@/types";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Filter,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  // Instant SWR cache read
  const cachedDashboard = ClientCache.get<DashboardProjection>(`dashboard_${eventId}`);

  const [milestones, setMilestones] = useState<TimelineMilestone[]>(cachedDashboard?.timeline?.milestones || []);
  const [tasks, setTasks] = useState<Task[]>(cachedDashboard?.timeline?.tasks || []);
  const [filter, setFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(!cachedDashboard);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [confirmDeleteTaskId, setConfirmDeleteTaskId] = useState<string | null>(null);

  // Add task modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskPriority, setTaskPriority] = useState<any>("MEDIUM");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTimeline = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/dashboard`);
      const json = await res.json();
      if (json.data) {
        setMilestones(json.data.timeline.milestones || []);
        setTasks(json.data.timeline.tasks || []);
        ClientCache.set(`dashboard_${eventId}`, json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [eventId]);

  const handleToggleTask = async (taskId: string, currentStatus: TaskStatus) => {
    const newStatus: TaskStatus = currentStatus === "COMPLETED" ? "TODO" : "COMPLETED";
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await fetch(`/api/events/${eventId}/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: newStatus }),
      });
      ClientCache.invalidate(`dashboard_${eventId}`);
      fetchTimeline();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setConfirmDeleteTaskId(null);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await fetch(`/api/events/${eventId}/tasks?taskId=${taskId}`, {
        method: "DELETE",
      });
      ClientCache.invalidate(`dashboard_${eventId}`);
      fetchTimeline();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await fetch(`/api/events/${eventId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle.trim(),
          description: taskDesc.trim(),
          due_at: taskDue || null,
          priority: taskPriority,
        }),
      });

      setIsTaskModalOpen(false);
      setTaskTitle("");
      setTaskDesc("");
      setTaskDue("");
      ClientCache.invalidate(`dashboard_${eventId}`);
      fetchTimeline();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === "COMPLETED") return t.status === "COMPLETED";
    if (filter === "PENDING") return t.status !== "COMPLETED";
    if (filter === "HIGH_PRIORITY") return t.priority === "HIGH" || t.priority === "URGENT";
    return true;
  });

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
                  Master Orchestration
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Master Timeline & Schedule</h1>
              <p className="text-xs text-slate-400 mt-1">
                Date-linked relative deadlines, milestone dependencies, and operational deliverables.
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
                <span>Adjust Deadlines with Concierge</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsTaskModalOpen(true)}
                className="gap-2 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </Button>
            </div>
          </div>

          {isLoading && tasks.length === 0 ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-32 bg-[#0D111A]/80 rounded-2xl border border-white/[0.08]" />
              <div className="h-64 bg-[#0D111A]/80 rounded-2xl border border-white/[0.08]" />
            </div>
          ) : (
            <>
              {/* Milestones Road */}
              <Card className="space-y-4 border border-white/[0.08]">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#C5A880]" />
                  <span>Milestone Roadmap ({milestones.length})</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {milestones.map((m, idx) => (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-xl bg-[#0D111A] border border-white/[0.08] space-y-1.5 relative hover:border-[#C5A880]/30 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-[#C5A880] font-bold">Phase {idx + 1}</span>
                        <Badge variant={m.status === "COMPLETED" ? "emerald" : "slate"}>{m.status}</Badge>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-200 line-clamp-2">{m.title}</h4>
                      <p className="text-[11px] text-slate-400 font-mono pt-1">{formatDate(m.due_at)}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Filter Bar & Task List */}
              <Card className="space-y-4 border border-white/[0.08]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Filter View:</span>
                    <div className="flex gap-1.5">
                      {["ALL", "PENDING", "COMPLETED", "HIGH_PRIORITY"].map((f) => (
                        <button
                          key={f}
                          onClick={() => setFilter(f)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            filter === f
                              ? "bg-[#C5A880] text-[#0A0B0E] font-semibold"
                              : "bg-[#14161C] text-slate-300 hover:bg-[#1E2028]"
                          }`}
                        >
                          {f.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>

                  <span className="text-xs text-slate-400 font-medium">
                    Showing {filteredTasks.length} of {tasks.length} items
                  </span>
                </div>

                <div className="space-y-2.5">
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-400">No tasks in this view.</div>
                  ) : (
                    filteredTasks.map((t) => {
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
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => handleToggleTask(t.id, t.status)}
                              className="w-4 h-4 rounded border-white/20 bg-[#14161C] text-[#C5A880] focus:ring-[#C5A880] cursor-pointer mt-0.5"
                            />
                            <div className="space-y-0.5">
                              <span className={`font-semibold ${isDone ? "line-through text-slate-500" : "text-white"}`}>
                                {t.title}
                              </span>
                              {t.description && (
                                <p className="text-[11px] text-slate-400 leading-relaxed max-w-xl font-light">
                                  {t.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                                {t.due_at && <span>Target Due: {formatDate(t.due_at)}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
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
                            {confirmDeleteTaskId === t.id ? (
                              <div className="flex items-center gap-2">
                                <button
                                onClick={() => handleDeleteTask(t.id)}
                                className="text-[11px] text-rose-400 font-semibold hover:text-rose-300 px-2 py-0.5"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setConfirmDeleteTaskId(null)}
                                className="text-[11px] text-slate-500 hover:text-slate-300"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteTaskId(t.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                              aria-label="Delete task"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
            </>
          )}
        </main>
      </div>

      {/* Add Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Add Actionable Task"
        description="Create a task with target deadline and priority level."
      >
        <form onSubmit={handleAddTask} className="space-y-4">
          <Input
            label="Task Title"
            required
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="e.g. Schedule Stage Lighting Walkthrough"
          />

          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium tracking-wider uppercase text-slate-300">Description</label>
            <textarea
              rows={2}
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Operational instructions or notes..."
              className="w-full bg-[#101217] border border-white/10 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#C5A880]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Target Due Date"
              type="date"
              value={taskDue}
              onChange={(e) => setTaskDue(e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium tracking-wider uppercase text-slate-300">Priority</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="w-full bg-[#101217] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-[#C5A880]"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="ghost" type="button" onClick={() => setIsTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Create Task
            </Button>
          </div>
        </form>
      </Modal>

      <AssistantDrawer
        eventId={eventId}
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onDataChanged={fetchTimeline}
      />
    </div>
  );
}
