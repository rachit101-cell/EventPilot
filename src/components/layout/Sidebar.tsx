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
  ShieldCheck,
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
      label: "Master Timeline",
      href: `/events/${eventId}/timeline`,
      icon: CalendarCheck2,
    },
    {
      label: "Vendor Partners",
      href: `/events/${eventId}/vendors`,
      icon: Users2,
    },
    {
      label: "Curated Concepts",
      href: `/events/${eventId}/ideas`,
      icon: Lightbulb,
    },
  ];

  return (
    <aside className="w-64 border-r border-white/[0.08] bg-[#070A12]/95 backdrop-blur-xl hidden md:flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4">
        <Link
          href="/events"
          className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-[#E8D5B5] transition-colors p-2 rounded-xl hover:bg-white/[0.04]"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#C5A880]" />
          <span>All Commissions</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1.5">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group",
                isActive
                  ? "bg-[#1C1811] text-[#E8D5B5] border border-[#C5A880]/35 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-[#C5A880]" : "text-slate-500 group-hover:text-slate-300"
                  )}
                />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#C5A880]" />}
            </Link>
          );
        })}
      </nav>

      {/* Atelier Status Footer */}
      <div className="p-4 border border-[#C5A880]/20 m-3 rounded-2xl bg-[#14120E] text-[11px] text-[#C5A880]/90 space-y-1 shadow-sm">
        <div className="flex items-center gap-1.5 font-semibold text-[#E8D5B5]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880]" />
          <span>Atelier Engine Active</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Master ledger, dates, and partner allocations synchronized with zero drift.
        </p>
      </div>
    </aside>
  );
};
