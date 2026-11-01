"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EventItem } from "@/types";
import { formatDate } from "@/lib/utils";
import { ClientCache } from "@/lib/client-cache";
import { Plus, Calendar, MapPin, Users, Compass, ArrowRight, Loader2, Sparkles } from "lucide-react";

export default function EventsListPage() {
  const cachedEvents = ClientCache.get<EventItem[]>("events_list");
  const [events, setEvents] = useState<EventItem[]>(cachedEvents || []);
  const [isLoading, setIsLoading] = useState(!cachedEvents);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setEvents(data.data);
          ClientCache.set("events_list", data.data);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-10 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-[0.25em] uppercase font-semibold text-[#C5A880]">
                Private Portfolio
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Your Event Commissions</h1>
            <p className="text-xs text-slate-400">
              Access the executive dashboard, financial ledger, master itinerary, and vendor directory.
            </p>
          </div>
          <Link href="/events/new">
            <Button variant="primary" className="gap-2 shadow-lg">
              <Plus className="w-4 h-4" />
              <span>New Commission</span>
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#C5A880]" />
          </div>
        ) : events.length === 0 ? (
          <Card className="text-center py-20 px-6 space-y-5 border border-white/[0.08]">
            <div className="w-14 h-14 rounded-2xl bg-[#1C1811] border border-[#C5A880]/30 text-[#C5A880] flex items-center justify-center mx-auto shadow-md">
              <Compass className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-white tracking-tight">No Active Event Commissions</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Describe your wedding, milestone gala, or community symposium to let our studio synthesize a tailored master plan.
              </p>
            </div>
            <Link href="/events/new">
              <Button variant="primary" className="gap-2">
                <Plus className="w-4 h-4" />
                <span>Begin Planning Now</span>
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => (
              <Link key={evt.id} href={`/events/${evt.id}`} prefetch={true}>
                <Card className="glass-card-hover h-full flex flex-col justify-between space-y-5 cursor-pointer group border border-white/[0.08] hover:border-[#C5A880]/40">
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={
                          evt.event_type === "WEDDING"
                            ? "gold"
                            : evt.event_type === "BIRTHDAY"
                            ? "amber"
                            : "blue"
                        }
                      >
                        {evt.event_type}
                      </Badge>
                      <span className="text-[10px] text-[#C5A880] tracking-widest uppercase font-semibold">
                        {evt.status}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-[#E8D5B5] transition-colors leading-snug">
                      {evt.name}
                    </h3>
                  </div>

                  <div className="pt-4 border-t border-white/[0.08] space-y-2.5 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span className="text-slate-300 font-medium">{formatDate(evt.date)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-0.5">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{evt.city}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium text-slate-300">
                        <Users className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>{evt.guest_count} guests</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
