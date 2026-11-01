import React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Calendar,
  Wallet,
  Users,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Top Navbar */}
      <nav className="h-16 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-900/40">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-purple-200 bg-clip-text text-transparent">
            EventPilot AI
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/events">
            <Button size="sm" variant="outline">
              Sign In
            </Button>
          </Link>
          <Link href="/events/new">
            <Button size="sm" variant="primary" className="gap-2 shadow-purple-900/40">
              <span>Launch Planner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20 lg:py-28 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/60 border border-purple-800/60 text-purple-300 text-xs font-medium mb-2 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Judging Baseline: Hackathon Demonstration Ready</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-100 leading-[1.15]">
          Organize Weddings, Birthdays & Events with{" "}
          <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent">
            Verifiable AI Intelligence
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Describe your event naturally. Receive an actionable plan with intelligent budget allocations,
          a date-aware timeline DAG, vendor requirements, and real-time conversational refinement.
        </p>

        {/* Demo Prompt Pill */}
        <div className="pt-2 pb-6 max-w-2xl mx-auto">
          <div className="glass-card rounded-2xl p-4 border border-purple-800/40 shadow-xl text-left space-y-3">
            <div className="flex items-center justify-between text-xs text-purple-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Sample Hackathon Brief
              </span>
              <span className="text-slate-400">Click to run in 1-click</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 font-mono bg-slate-900/80 p-3 rounded-xl border border-slate-800 leading-relaxed">
              &ldquo;I want to organize a wedding for 250 guests in Bangalore with a budget of ₹15 lakhs in December.&rdquo;
            </p>
            <div className="flex justify-end">
              <Link href="/events/new">
                <Button size="sm" variant="primary" className="gap-2">
                  <span>Create with this brief</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars Grid */}
      <section className="px-6 py-12 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card glass-card-hover rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-900/40 text-purple-400 flex items-center justify-center border border-purple-800/50">
            <Wallet className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-100">Zero-Drift Budget Engine</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Integer-based financial arithmetic using the Largest Remainder Method ensures total allocations and
            contingency match your budget down to the exact rupee without floating-point errors.
          </p>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-900/40 text-indigo-400 flex items-center justify-center border border-indigo-800/50">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-100">Date-Aware Timeline DAG</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Milestones and tasks resolve relative offsets from the event date. Shifting an event date automatically
            recalculates unlocked deadlines while guarding against impossible dependencies.
          </p>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-900/40 text-emerald-400 flex items-center justify-center border border-emerald-800/50">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-100">Safe AI Modifications</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            The AI proposes typed actions instead of arbitrarily rewriting database rows. Inspect before/after diffs,
            verify capacity implications, and confirm with confidence.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 EventPilot AI. Built for hackathon demonstration with Next.js 15, TypeScript & SQLite.</p>
      </footer>
    </div>
  );
}
