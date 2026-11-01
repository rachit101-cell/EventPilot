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
import { Task, TimelineMilestone, TaskStatus } from "@/types";
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

  const [milestones, setMilestones] = useState<TimelineMilestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

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
    try {
      await fetch(`/api/events/${eventId}/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: newStatus }),
      });
      fetchTimeline();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/events/${eventId}/tasks?taskId=${taskId}`, {
        method: "DELETE",
      });
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

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar onOpenAssistant={() => setIsAssistantOpen(true)} />

      <div className="flex-1 flex">
        <Sidebar eventId={eventId} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Timeline & Task DAG</h1>
              <p className="text-xs text-slate-400 mt-1">
                Date-aware relative offsets, milestone dependencies, and operational task execution
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
                <span>Adjust Deadlines with AI</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsTaskModalOpen(true)}
                className="gap-2 shadow-purple-900/40"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </Button>
            </div>
          </div>

          {/* Milestones Road */}
          <Card className="space-y-4">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>Milestone Roadmap ({milestones.length})</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {milestones.map((m, idx) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 relative"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-purple-400 font-bold">Step {idx + 1}</span>
                    <Badge variant={m.status === "COMPLETED" ? "emerald" : "slate"}>{m.status}</Badge>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200 line-clamp-2">{m.title}</h4>
                  <p className="text-[11px] text-slate-400 font-mono pt-1">{formatDate(m.due_at)}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Filter Bar & Task List */}
          <Card className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-semibold uppercase tracking-wider">Filter:</span>
                <div className="flex gap-1.5">
                  {["ALL", "PENDING", "COMPLETED", "HIGH_PRIORITY"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        filter === f
                          ? "bg-purple-600 text-white"
                          : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {f.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              <span className="text-xs text-slate-400 font-medium">
                Showing {filteredTasks.length} of {tasks.length} tasks
              </span>
            </div>

            <div className="space-y-2">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">No tasks in this view.</div>
              ) : (
                filteredTasks.map((t) => {
                  const isDone = t.status === "COMPLETED";
                  return (
                    <div
                      key={t.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                        isDone
                          ? "bg-slate-900/30 border-slate-800/50 text-slate-500"
                          : "bg-slate-900/70 border-slate-800 text-slate-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => handleToggleTask(t.id, t.status)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-purple-500 cursor-pointer mt-0.5"
                        />
                        <div className="space-y-0.5">
                          <span className={`font-semibold ${isDone ? "line-through text-slate-500" : ""}`}>
                            {t.title}
                          </span>
                          {t.description && (
                            <p className="text-[11px] text-slate-400 leading-relaxed max-w-xl">
                              {t.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                            {t.due_at && <span>Target Due: {formatDate(t.due_at)}</span>}
                            <span className="text-slate-500">|</span>
                            <span className="text-slate-500 font-mono text-[10px] uppercase">{t.source}</span>
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
                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          aria-label="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
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
            <label className="block text-xs font-medium text-slate-300">Description</label>
            <textarea
              rows={2}
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Operational instructions or notes..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500"
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
              <label className="block text-xs font-medium text-slate-300">Priority</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-2.5 text-xs text-slate-100"
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
