"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import {
  Sparkles,
  Calendar,
  Users,
  MapPin,
  Wallet,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  AlertCircle,
  Loader2,
  Compass,
} from "lucide-react";

export default function NewEventOnboardingPage() {
  const router = useRouter();

  const [prompt, setPrompt] = useState(
    "I want to organize a wedding for 250 guests in Bangalore with a budget of ₹15 lakhs in December."
  );
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

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
    "Birthday celebration for 40 guests in Pune next month under ₹80,000",
    "Community tech symposium for 500 attendees in Mumbai with ₹10 lakhs budget",
  ];

  const handleExtract = async (textToExtract: string) => {
    setIsExtracting(true);
    setErrorBanner(null);
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
      setErrorBanner("Could not analyze brief. Please check connection.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCreateAndGenerate = async () => {
    setIsGenerating(true);
    setErrorBanner(null);
    setGenerationStep("Establishing commission workspace...");

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
      if (!createRes.ok) throw new Error(createData.error?.message || "Failed to create event workspace");

      const eventId = createData.data.id;

      // 2. Generate Plan
      setGenerationStep("Computing balanced financial allocations...");
      await new Promise((r) => setTimeout(r, 400));

      setGenerationStep("Orchestrating milestone schedule & partner roadmap...");
      const genRes = await fetch(`/api/events/${eventId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget_minor: extracted.budget_minor || 150000000,
        }),
      });

      if (!genRes.ok) {
        const genData = await genRes.json().catch(() => ({}));
        throw new Error(genData.error?.message || "Plan orchestration failed. Please try again.");
      }

      setGenerationStep("Synchronizing executive dashboard...");
      await new Promise((r) => setTimeout(r, 300));

      // Navigate to dashboard
      router.push(`/events/${eventId}`);
    } catch (err: any) {
      setErrorBanner(err.message || "An unexpected error occurred during commission setup.");
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-10 space-y-8">
        <div className="text-center space-y-2.5 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1C1811] border border-[#C5A880]/35 text-[#E6C79C] text-[11px] font-medium tracking-wide">
            <Compass className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Atelier Intake Consultation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Articulate Your Event Vision
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
            State your preferred location, guest count, celebration theme, and financial target. Our studio director will synthesize an actionable operational plan.
          </p>
        </div>

        {/* Composer Card */}
        <Card className="space-y-5 border border-white/[0.08]">
          <div className="space-y-2">
            <label htmlFor="prompt-input" className="text-[11px] font-semibold text-slate-300 tracking-wider uppercase flex items-center justify-between">
              <span>Event Commission Brief</span>
              <span className="text-[11px] text-slate-400 font-normal lowercase">free-form or select a preset below</span>
            </label>
            <div className="relative">
              <textarea
                id="prompt-input"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. I want to organize a wedding for 250 guests in Bangalore with a budget of ₹15 lakhs in December..."
                className="w-full bg-[#0E1015] border border-white/10 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#C5A880]/70 focus:ring-1 focus:ring-[#C5A880]/40 transition-colors leading-relaxed"
              />
            </div>
          </div>

          {/* Sample Prompts */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-[#C5A880] font-semibold tracking-wider uppercase">Presets:</span>
            {samplePrompts.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(s);
                  handleExtract(s);
                }}
                className="text-[11px] bg-[#14161C] hover:bg-[#1F1B14] border border-white/10 hover:border-[#C5A880]/50 text-slate-300 hover:text-[#E8D5B5] rounded-lg px-3 py-1.5 text-left transition-colors"
              >
                {s.split(" with ")[0]}...
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-2 border-t border-white/[0.06]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExtract(prompt)}
              isLoading={isExtracting}
              className="gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Analyze Commission Parameters</span>
            </Button>
          </div>
        </Card>

        {/* Real-time Extracted Parameters Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#C5A880]" />
              <span>Confirmed Parameters</span>
            </h2>
            <span className="text-xs text-slate-400">Click any field to calibrate directly</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Event Type */}
            <div className="glass-card rounded-xl p-4 space-y-1.5 border border-white/[0.08]">
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" /> Commission Type
              </span>
              <select
                value={extracted.event_type || "WEDDING"}
                onChange={(e) => setExtracted({ ...extracted, event_type: e.target.value })}
                className="w-full bg-[#0E1015] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-[#C5A880]"
              >
                <option value="WEDDING">Wedding</option>
                <option value="BIRTHDAY">Birthday Gala</option>
                <option value="COMMUNITY">Community Symposium</option>
              </select>
            </div>

            {/* Guest Count */}
            <div className="glass-card rounded-xl p-4 space-y-1.5 border border-white/[0.08]">
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#8EB8E5]" /> Guest Count
              </span>
              <input
                type="number"
                value={extracted.guest_count || ""}
                onChange={(e) => setExtracted({ ...extracted, guest_count: Number(e.target.value) })}
                className="w-full bg-[#0E1015] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-[#C5A880]"
                placeholder="250"
              />
            </div>

            {/* Budget */}
            <div className="glass-card rounded-xl p-4 space-y-1.5 border border-white/[0.08]">
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-[#C5A880]" /> Target Budget (₹)
              </span>
              <input
                type="number"
                value={extracted.budget_minor ? Math.round(extracted.budget_minor / 100) : ""}
                onChange={(e) =>
                  setExtracted({
                    ...extracted,
                    budget_minor: Math.round(Number(e.target.value) * 100),
                  })
                }
                className="w-full bg-[#0E1015] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-[#C5A880]"
                placeholder="1500000"
              />
              <p className="text-[10px] text-[#C5A880] font-mono">
                {formatCurrency(extracted.budget_minor || 0, "INR")}
              </p>
            </div>

            {/* City */}
            <div className="glass-card rounded-xl p-4 space-y-1.5 border border-white/[0.08]">
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" /> Destination City
              </span>
              <input
                type="text"
                value={extracted.city || ""}
                onChange={(e) => setExtracted({ ...extracted, city: e.target.value })}
                className="w-full bg-[#0E1015] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-[#C5A880]"
                placeholder="Bengaluru"
              />
            </div>
          </div>
        </div>

        {/* Follow-up Clarifications */}
        {extracted.follow_up_questions && extracted.follow_up_questions.length > 0 && (
          <Card className="border-[#C5A880]/30 bg-[#14120E] space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#E6C79C]">
              <HelpCircle className="w-4 h-4 text-[#C5A880]" />
              <span>Studio Clarifications (Optional)</span>
            </div>
            <div className="space-y-2">
              {extracted.follow_up_questions.map((q: string, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#0E1015]/80 text-xs border border-white/[0.06]">
                  <span className="text-slate-200">{q}</span>
                  <button
                    onClick={() => {
                      const updated = extracted.follow_up_questions.filter((_: any, i: number) => i !== idx);
                      setExtracted({ ...extracted, follow_up_questions: updated });
                    }}
                    className="text-[11px] text-[#C5A880] hover:text-[#E8D5B5] font-medium tracking-wide uppercase px-2 py-0.5"
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
          {errorBanner && (
            <div className="w-full max-w-lg bg-rose-950/60 border border-rose-800/80 rounded-xl px-4 py-3 text-xs text-rose-200 text-center font-medium">
              {errorBanner}
            </div>
          )}
          <Button
            size="lg"
            variant="primary"
            onClick={handleCreateAndGenerate}
            isLoading={isGenerating}
            className="w-full sm:w-auto px-10 gap-3 text-sm sm:text-base shadow-xl"
          >
            <Sparkles className="w-4 h-4 text-[#0A0B0E]" />
            <span>Generate Master Event Plan</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          {isGenerating && (
            <p className="text-xs text-[#E6C79C] font-medium animate-pulse flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C5A880]" />
              <span>{generationStep}</span>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
