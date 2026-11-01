"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  WalletCards,
  CalendarCheck2,
  Users2,
  Lightbulb,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";

export interface SidebarProps {
  eventId: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ eventId }) => {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Overview",
      href: `/events/${eventId}`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: "Budget & Expenses",
      href: `/events/${eventId}/budget`,
      icon: WalletCards,
    },
    {
      label: "Timeline & Tasks",
      href: `/events/${eventId}/timeline`,
      icon: CalendarCheck2,
    },
    {
      label: "Vendor Checklist",
      href: `/events/${eventId}/vendors`,
      icon: Users2,
    },
    {
      label: "Personalized Ideas",
      href: `/events/${eventId}/ideas`,
      icon: Lightbulb,
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-[#0d1322]/80 backdrop-blur-md hidden md:flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4">
        <Link
          href="/events"
          className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800/60"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Events</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group",
                isActive
                  ? "bg-purple-600/20 text-purple-200 border border-purple-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-purple-400" : "text-slate-500 group-hover:text-slate-300"
                  )}
                />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-purple-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Provenance Footer */}
      <div className="p-4 border-t border-slate-800/80 m-3 rounded-xl bg-purple-950/20 border text-[11px] text-purple-300/80 space-y-1">
        <p className="font-semibold text-purple-200">Deterministic Engine Active</p>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Financial math, dates, and state transitions are validated server-side.
        </p>
      </div>
    </aside>
  );
};
