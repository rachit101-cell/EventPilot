"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface NavbarProps {
  eventName?: string;
  onOpenAssistant?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ eventName, onOpenAssistant }) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href="/events" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-900/30 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-purple-200 bg-clip-text text-transparent">
            EventPilot AI
          </span>
        </Link>

        {eventName && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 pl-3 border-l border-slate-800">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-medium text-slate-200 max-w-[200px] truncate">{eventName}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {onOpenAssistant && (
          <Button
            size="sm"
            onClick={onOpenAssistant}
            className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md shadow-purple-900/40"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden sm:inline">Ask AI Assistant</span>
            <span className="sm:hidden">AI</span>
          </Button>
        )}
      </div>
    </header>
  );
};
