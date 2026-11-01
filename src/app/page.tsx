import React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Wallet,
  Users,
  Compass,
  Star,
  Clock,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Top Haute Navbar */}
      <nav className="h-20 border-b border-white/[0.08] bg-[#070A12]/90 backdrop-blur-xl px-6 sm:px-12 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#DFC094] via-[#C5A880] to-[#8C6D3B] flex items-center justify-center text-[#0A0B0E] font-serif font-black text-base shadow-lg shadow-[#C5A880]/20">
            EP
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-base tracking-tight text-white flex items-center gap-2">
              EventPilot <span className="text-[10px] tracking-[0.25em] uppercase font-light text-[#C5A880] px-2 py-0.5 rounded border border-[#C5A880]/30 bg-[#C5A880]/10">Atelier</span>
            </span>
            <span className="text-[10px] text-slate-400 tracking-wider uppercase">Bespoke Event Direction</span>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/events" prefetch={true}>
            <Button size="sm" variant="ghost" className="text-slate-300 hover:text-white">
              Client Portal
            </Button>
          </Link>
          <Link href="/events/new" prefetch={true}>
            <Button size="sm" variant="primary" className="gap-2">
              <span>Commission an Event</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section - Editorial Haute Luxury */}
      <section className="relative px-6 pt-20 pb-16 lg:pt-28 lg:pb-24 max-w-5xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#181510] border border-[#C5A880]/35 text-[#E6C79C] text-xs font-medium tracking-wide shadow-sm">
          <Star className="w-3.5 h-3.5 text-[#C5A880] fill-[#C5A880]" />
          <span>Private Concierge for High-Stakes Celebrations</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.12]">
          Curate Extraordinary Events with{" "}
          <span className="gold-gradient-text block sm:inline">
            Uncompromising Precision.
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-light">
          From multi-day luxury weddings to milestone galas. Articulate your grand vision in plain words, and our studio director synthesizes a balanced financial ledger, master itinerary, and vendor roadmap in seconds.
        </p>

        {/* Action Button & Sample Brief Card */}
        <div className="pt-4 max-w-2xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/events/new" className="w-full sm:w-auto">
              <Button size="lg" variant="primary" className="w-full sm:w-auto px-8 gap-3 shadow-xl">
                <span>Start Event Commission</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/events" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto px-6">
                <span>Browse Portfolio</span>
              </Button>
            </Link>
          </div>

          {/* Sample Brief Card with Luxury Presentation */}
          <div className="glass-card rounded-2xl p-5 border border-[#C5A880]/25 shadow-2xl text-left space-y-3.5 mt-8">
            <div className="flex items-center justify-between text-xs text-[#E6C79C]">
              <span className="flex items-center gap-2 tracking-wider uppercase text-[10px] font-semibold">
                <Compass className="w-3.5 h-3.5 text-[#C5A880]" />
                Featured Commission Brief
              </span>
              <span className="text-[11px] text-slate-400">One-click demonstration</span>
            </div>

            <div className="bg-[#0D0F14]/90 p-4 rounded-xl border border-white/[0.08] relative group">
              <p className="text-xs sm:text-sm text-slate-200 font-mono leading-relaxed">
                &ldquo;I want to organize a wedding for 250 guests in Bangalore with a budget of ₹15 lakhs in December.&rdquo;
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                Instantly generates zero-drift budget, task sequence, and verified vendor roles.
              </span>
              <Link href="/events/new">
                <Button size="sm" variant="gold" className="gap-1.5 shrink-0 text-xs">
                  <span>Load Brief</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Haute Architecture Pillars */}
      <section className="px-6 py-16 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card glass-card-hover rounded-2xl p-7 space-y-4">
          <div className="w-11 h-11 rounded-xl bg-[#1C1811] text-[#C5A880] flex items-center justify-center border border-[#C5A880]/30">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-white tracking-tight">Zero-Drift Financial Ledger</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              Integer-based arithmetic allocates contingency and sub-budgets to the exact rupee. Live expense tracking verifies invoices against confirmed allocations.
            </p>
          </div>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-7 space-y-4">
          <div className="w-11 h-11 rounded-xl bg-[#181A22] text-[#8EB8E5] flex items-center justify-center border border-[#8EB8E5]/30">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-white tracking-tight">Master Date-Aware Timeline</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              Tasks and milestones link dynamically to the event date. Shift celebration dates with a single prompt and watch every unlocked deadline orchestrate automatically.
            </p>
          </div>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-7 space-y-4">
          <div className="w-11 h-11 rounded-xl bg-[#111A16] text-[#7CE4B5] flex items-center justify-center border border-[#10B981]/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-white tracking-tight">Executive Change Approvals</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              Ask to increase guest counts or reduce floral decor. Review structured before/after diffs and approve with one click—no silent or destructive alterations.
            </p>
          </div>
        </div>
      </section>

      {/* Haute Experience Statement */}
      <section className="px-6 py-14 max-w-4xl mx-auto w-full text-center space-y-4 border-t border-white/[0.06]">
        <div className="w-10 h-10 rounded-full bg-[#1C1811] border border-[#C5A880]/30 text-[#C5A880] flex items-center justify-center mx-auto">
          <Award className="w-5 h-5" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
          Designed for Discerning Planners & Luxury Couples
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
          Weddings, gala anniversaries, and community symposiums curated with the precision of a Swiss timepiece and the warmth of a bespoke concierge.
        </p>
      </section>

      {/* Editorial Footer */}
      <footer className="mt-auto border-t border-white/[0.08] bg-[#07080A] py-10 px-6 sm:px-12 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#C5A880] text-[#0A0B0E] font-serif font-black text-xs flex items-center justify-center">
            EP
          </div>
          <span className="text-slate-300 font-medium">EventPilot Atelier</span>
          <span className="text-slate-600">·</span>
          <span>Bespoke Event Intelligence</span>
        </div>
        <p className="text-slate-500">
          Engineered with Next.js 15, TypeScript & Deterministic SQLite Architecture.
        </p>
      </footer>
    </div>
  );
}
