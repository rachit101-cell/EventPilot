"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Calendar, ChevronRight, Crown } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface NavbarProps {
  eventName?: string;
  onOpenAssistant?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ eventName, onOpenAssistant }) => {
  return (
    <header className="h-16 border-b border-white/[0.08] bg-[#070A12]/90 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/events" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#DFC094] via-[#C5A880] to-[#8C6D3B] flex items-center justify-center text-[#0A0B0E] font-serif font-black text-sm shadow-md shadow-[#C5A880]/20 group-hover:scale-105 transition-transform">
            EP
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
              EventPilot <span className="text-[10px] tracking-[0.2em] uppercase font-light text-[#C5A880] px-1.5 py-0.5 rounded border border-[#C5A880]/30 bg-[#C5A880]/10">Atelier</span>
            </span>
          </div>
        </Link>

        {eventName && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 pl-4 border-l border-white/10">
            <Calendar className="w-3.5 h-3.5 text-[#C5A880]" />
            <span className="font-medium text-slate-200 max-w-[220px] truncate">{eventName}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {onOpenAssistant && (
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenAssistant}
            className="gap-2 bg-[#14161C]/80 hover:bg-[#1E1B15] text-[#E8D5B5] border-[#C5A880]/40 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            <span className="hidden sm:inline font-medium">Event Concierge</span>
            <span className="sm:hidden font-medium">Concierge</span>
          </Button>
        )}
      </div>
    </header>
  );
};
