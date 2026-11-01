"use client";

import React, { useState, useEffect, use } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { AssistantDrawer } from "@/components/ai/AssistantDrawer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ClientCache } from "@/lib/client-cache";
import { AIRecommendation, DashboardProjection } from "@/types";
import {
  Lightbulb,
  Sparkles,
  Bookmark,
  Check,
  X,
  Loader2,
  Compass,
} from "lucide-react";

export default function IdeasPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  // Instant SWR cache read
  const cachedDashboard = ClientCache.get<DashboardProjection>(`dashboard_${eventId}`);
  const cachedIdeas = ClientCache.get<AIRecommendation[]>(`ideas_${eventId}`);

  const [ideas, setIdeas] = useState<AIRecommendation[]>(cachedIdeas || cachedDashboard?.recommendations || []);
  const [filter, setFilter] = useState("ALL");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(!cachedIdeas && !cachedDashboard);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const fetchIdeas = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/recommendations`);
      const json = await res.json();
      if (json.data) {
        setIdeas(json.data);
        ClientCache.set(`ideas_${eventId}`, json.data);
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
    setIdeas((prev) => prev.filter((i) => i.id !== ideaId));
    try {
      await fetch(`/api/events/${eventId}/recommendations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId, dismissed: true }),
      });
      ClientCache.invalidate(`ideas_${eventId}`);
      ClientCache.invalidate(`dashboard_${eventId}`);
      fetchIdeas();
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
                  Creative Direction
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Curated Concepts & Lookbook</h1>
              <p className="text-xs text-slate-400 mt-1">
                Contextual themes, immersive guest experiences, and artisanal catering tailored to your celebration.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAssistantOpen(true)}
                className="gap-2 shadow-lg"
              >
                <Sparkles className="w-4 h-4 text-[#0A0B0E]" />
                <span>Brainstorm with Concierge</span>
              </Button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mr-1">Category:</span>
            {["ALL", "EXPERIENCE", "THEME", "CATERING", "LOGISTICS"].map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  filter === k
                    ? "bg-[#C5A880] text-[#0A0B0E] font-semibold shadow-sm"
                    : "bg-[#14161C] text-slate-300 hover:bg-[#1E2028] border border-white/10"
                }`}
              >
                {k.charAt(0) + k.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {isLoading && ideas.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
              <div className="h-44 bg-[#0D111A]/80 rounded-2xl border border-white/[0.08]" />
              <div className="h-44 bg-[#0D111A]/80 rounded-2xl border border-white/[0.08]" />
              <div className="h-44 bg-[#0D111A]/80 rounded-2xl border border-white/[0.08]" />
            </div>
          ) : (
            /* Ideas Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredIdeas.length === 0 ? (
                <div className="col-span-full text-center py-14 text-sm text-slate-400">
                  No curated concepts in this category. Ask your concierge to brainstorm tailored ideas.
                </div>
              ) : filteredIdeas.map((idea) => {
                const isSaved = savedIds.has(idea.id);

                return (
                  <Card
                    key={idea.id}
                    className="glass-card-hover flex flex-col justify-between space-y-4 border border-white/[0.08]"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="gold" className="capitalize">
                          {idea.kind}
                        </Badge>
                        <button
                          onClick={() => toggleSave(idea.id)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isSaved
                              ? "bg-[#252015] border-[#C5A880] text-[#E8D5B5]"
                              : "border-white/10 text-slate-400 hover:text-white"
                          }`}
                          title={isSaved ? "Saved" : "Save concept"}
                          aria-label={isSaved ? "Unsave concept" : "Save concept"}
                        >
                          <Bookmark className="w-4 h-4 fill-current" />
                        </button>
                      </div>

                      <h3 className="text-base font-bold text-white tracking-tight">{idea.title}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed font-light">{idea.description}</p>
                    </div>

                    <div className="pt-3 border-t border-white/[0.08] space-y-2">
                      {idea.cost_range && (
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-400">Estimated Cost:</span>
                          <span className="text-[#7CE4B5] font-semibold">{idea.cost_range}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-end pt-1">
                        <button
                          onClick={() => handleDismiss(idea.id)}
                          aria-label="Dismiss concept"
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
          )}
        </main>
      </div>

      {/* Floating Concierge Drawer */}
      <AssistantDrawer
        eventId={eventId}
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onDataChanged={fetchIdeas}
      />
    </div>
  );
}
