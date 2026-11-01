"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";
import {
  Sparkles,
  Send,
  Calendar,
  Users,
  MapPin,
  Wallet,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function NewEventOnboardingPage() {
  const router = useRouter();

  const [prompt, setPrompt] = useState(
    "I want to organize a wedding for 250 guests in Bangalore with a budget of ₹15 lakhs in December."
  );
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");

  const [extracted, setExtracted] = useState<any>({
    event_type: "WEDDING",
    name: "Bengaluru Grand Wedding",
    date: "2027-12-15",
    city: "Bengaluru",
    guest_count: 250,
    budget_minor: 150000000, // ₹15 Lakhs in paise
    style: "Modern Traditional",
    follow_up_questions: [],
  });

  const samplePrompts = [
    "Wedding for 250 guests in Bangalore with budget of ₹15 lakhs in December",
    "Birthday party for 40 people in Pune next month under ₹80,000",
    "Community tech festival for 500 attendees in Mumbai with ₹10 lakhs budget",
  ];

  const handleExtract = async (textToExtract: string) => {
    setIsExtracting(true);
    try {
      const res = await fetch("/api/events/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: textToExtract, context: extracted }),
      });
      const data = await res.json();
      if (data.data) {
        setExtracted((prev: any) => ({
          ...prev,
          ...data.data,
        }));
      }
    } catch (e) {
      console.error("Extraction error", e);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCreateAndGenerate = async () => {
    setIsGenerating(true);
    setGenerationStep("Creating event workspace...");

    try {
      // 1. Create event
      const createRes = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: extracted.name || `${extracted.city || "Grand"} ${extracted.event_type || "Event"}`,
          event_type: extracted.event_type || "WEDDING",
          date: extracted.date || "2027-12-15",
          city: extracted.city || "Bengaluru",
          guest_count: extracted.guest_count || 150,
          currency: "INR",
          style: extracted.style || "Modern Traditional",
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error?.message || "Failed to create event");

      const eventId = createData.data.id;

      // 2. Generate Plan
      setGenerationStep("Computing zero-drift budget allocations...");
      await new Promise((r) => setTimeout(r, 400));

      setGenerationStep("Synthesizing milestone roadmap & vendor checklists...");
      const genRes = await fetch(`/api/events/${eventId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget_minor: extracted.budget_minor || 150000000,
        }),
      });

      if (!genRes.ok) throw new Error("Plan generation failed");

      setGenerationStep("Finalizing dashboard synchronization...");
      await new Promise((r) => setTimeout(r, 300));

      // Navigate to dashboard
      router.push(`/events/${eventId}`);
    } catch (err: any) {
      alert("Error: " + err.message);
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/60 text-purple-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Conversational Onboarding</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
            Describe Your Vision in Natural Language
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Our AI extraction layer analyzes your prompt, understands the scope, and asks only high-value
            clarifications before generating your plan.
          </p>
        </div>

        {/* Composer Card */}
        <Card className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="prompt-input" className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Event Brief / Natural Language Description</span>
              <span className="text-[11px] text-slate-500 font-normal">Free-form or click a sample below</span>
            </label>
            <div className="relative">
              <textarea
                id="prompt-input"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. I want to organize a wedding for 250 guests in Bangalore with a budget of ₹15 lakhs in December..."
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Sample Prompts */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">Try Hackathon Samples:</span>
            {samplePrompts.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(s);
                  handleExtract(s);
                }}
                className="text-[11px] bg-slate-800/80 hover:bg-purple-950/70 border border-slate-700 hover:border-purple-600/60 text-slate-300 hover:text-purple-200 rounded-lg px-2.5 py-1 text-left transition-colors"
              >
                {s.split(" with ")[0]}...
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExtract(prompt)}
              isLoading={isExtracting}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Analyze & Extract Parameters</span>
            </Button>
          </div>
        </Card>

        {/* Real-time Extracted Parameters & Validation Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Extracted Event Parameters</span>
            </h2>
            <span className="text-xs text-slate-400">Click any field to edit directly</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Event Type */}
            <div className="glass-card rounded-xl p-4 space-y-1.5 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Event Type
              </span>
              <select
                value={extracted.event_type || "WEDDING"}
                onChange={(e) => setExtracted({ ...extracted, event_type: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-semibold"
              >
                <option value="WEDDING">Wedding</option>
                <option value="BIRTHDAY">Birthday</option>
                <option value="COMMUNITY">Community Event</option>
              </select>
            </div>

            {/* Guest Count */}
            <div className="glass-card rounded-xl p-4 space-y-1.5 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" /> Guest Count
              </span>
              <input
                type="number"
                value={extracted.guest_count || ""}
                onChange={(e) => setExtracted({ ...extracted, guest_count: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-semibold"
                placeholder="250"
              />
            </div>

            {/* Budget */}
            <div className="glass-card rounded-xl p-4 space-y-1.5 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" /> Target Budget
              </span>
              <div className="text-xs font-mono font-bold text-emerald-300 py-1.5">
                {formatCurrency(extracted.budget_minor || 150000000, "INR")}
              </div>
            </div>

            {/* City */}
            <div className="glass-card rounded-xl p-4 space-y-1.5 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" /> Location / City
              </span>
              <input
                type="text"
                value={extracted.city || ""}
                onChange={(e) => setExtracted({ ...extracted, city: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-semibold"
                placeholder="Bengaluru"
              />
            </div>
          </div>
        </div>

        {/* Follow-up Questions (PRD at most 3 questions) */}
        {extracted.follow_up_questions && extracted.follow_up_questions.length > 0 && (
          <Card className="border-purple-800/50 bg-purple-950/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
              <HelpCircle className="w-4 h-4 text-purple-400" />
              <span>Suggested Follow-up Clarifications (Optional)</span>
            </div>
            <div className="space-y-2">
              {extracted.follow_up_questions.map((q: string, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 text-xs">
                  <span className="text-slate-200">{q}</span>
                  <button
                    onClick={() => {
                      const updated = extracted.follow_up_questions.filter((_: any, i: number) => i !== idx);
                      setExtracted({ ...extracted, follow_up_questions: updated });
                    }}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-medium"
                  >
                    Skip
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Generate Plan CTA Button */}
        <div className="pt-4 flex flex-col items-center gap-3">
          <Button
            size="lg"
            variant="primary"
            onClick={handleCreateAndGenerate}
            isLoading={isGenerating}
            className="w-full sm:w-auto px-10 gap-3 text-base shadow-xl shadow-purple-900/40"
          >
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span>Generate Complete Event Plan</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          {isGenerating && (
            <p className="text-xs text-purple-300 font-medium animate-pulse flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{generationStep}</span>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
