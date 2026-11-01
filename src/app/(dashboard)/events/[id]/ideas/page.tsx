"use client";

import React, { useState, useEffect, use } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { AssistantDrawer } from "@/components/ai/AssistantDrawer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AIRecommendation } from "@/types";
import {
  Lightbulb,
  Sparkles,
  Bookmark,
  Check,
  X,
  RefreshCw,
  Loader2,
  DollarSign,
} from "lucide-react";

export default function IdeasPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [ideas, setIdeas] = useState<AIRecommendation[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const fetchIdeas = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/recommendations`);
      const json = await res.json();
      if (json.data) {
        setIdeas(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, [eventId]);

  const handleDismiss = async (ideaId: string) => {
    try {
      await fetch(`/api/events/${eventId}/recommendations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId, dismissed: true }),
      });
      setIdeas((prev) => prev.filter((i) => i.id !== ideaId));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSave = (ideaId: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(ideaId)) next.delete(ideaId);
      else next.add(ideaId);
      return next;
    });
  };

  const filteredIdeas = ideas.filter((idea) => {
    if (filter === "ALL") return true;
    return idea.kind.toUpperCase() === filter;
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
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Personalized Event Ideas</h1>
              <p className="text-xs text-slate-400 mt-1">
                Contextual themes, guest experiences, and artisanal catering grounded in your confirmed style
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAssistantOpen(true)}
                className="gap-2 shadow-purple-900/40"
              >
                <Sparkles className="w-4 h-4" />
                <span>Brainstorm More Ideas</span>
              </Button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider mr-1">Category:</span>
            {["ALL", "EXPERIENCE", "THEME", "CATERING", "LOGISTICS"].map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
                  filter === k
                    ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/60"
                }`}
              >
                {k.charAt(0) + k.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Ideas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredIdeas.map((idea) => {
              const isSaved = savedIds.has(idea.id);

              return (
                <Card
                  key={idea.id}
                  className="glass-card-hover flex flex-col justify-between space-y-4 border border-slate-800/90"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="purple" className="capitalize">
                        {idea.kind}
                      </Badge>
                      <button
                        onClick={() => toggleSave(idea.id)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isSaved
                            ? "bg-purple-950 border-purple-700 text-purple-300"
                            : "border-slate-800 text-slate-400 hover:text-white"
                        }`}
                        title={isSaved ? "Saved" : "Save idea"}
                      >
                        <Bookmark className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    <h3 className="text-base font-bold text-slate-100">{idea.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{idea.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    {idea.cost_range && (
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">Estimated Cost:</span>
                        <span className="text-emerald-400 font-semibold">{idea.cost_range}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                        {idea.source}
                      </span>
                      <button
                        onClick={() => handleDismiss(idea.id)}
                        className="text-[11px] text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
                      >
                        <X className="w-3 h-3" /> Dismiss
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </main>
      </div>

      <AssistantDrawer
        eventId={eventId}
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onDataChanged={fetchIdeas}
      />
    </div>
  );
}
