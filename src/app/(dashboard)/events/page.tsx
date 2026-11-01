"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EventItem } from "@/types";
import { formatDate } from "@/lib/utils";
import { Plus, Calendar, MapPin, Users, Sparkles, ArrowRight, Loader2 } from "lucide-react";

export default function EventsListPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setEvents(data.data);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Your Events</h1>
            <p className="text-xs text-slate-400 mt-1">
              Select an event to view dashboard, budget, timeline, and vendors
            </p>
          </div>
          <Link href="/events/new">
            <Button variant="primary" className="gap-2 shadow-purple-900/40">
              <Plus className="w-4 h-4" />
              <span>Create Event</span>
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : events.length === 0 ? (
          <Card className="text-center py-16 px-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-800/40 text-purple-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-100">No events created yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Start by describing your wedding, birthday, or community event in natural language.
              </p>
            </div>
            <Link href="/events/new">
              <Button variant="primary" className="gap-2">
                <Plus className="w-4 h-4" />
                <span>Start Planning Now</span>
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((evt) => (
              <Link key={evt.id} href={`/events/${evt.id}`}>
                <Card className="glass-card-hover h-full flex flex-col justify-between space-y-4 cursor-pointer group">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={
                          evt.event_type === "WEDDING"
                            ? "purple"
                            : evt.event_type === "BIRTHDAY"
                            ? "amber"
                            : "blue"
                        }
                      >
                        {evt.event_type}
                      </Badge>
                      <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                        {evt.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                      {evt.name}
                    </h3>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{formatDate(evt.date)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{evt.city}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium text-slate-300">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
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
