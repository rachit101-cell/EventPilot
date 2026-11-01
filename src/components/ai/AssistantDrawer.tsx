"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DiffModal } from "./DiffModal";
import { AIConversationMessage, ActionProposal } from "@/types";
import { Sparkles, Send, X, ArrowUpRight, Bot, CheckCircle2, Compass } from "lucide-react";

export interface AssistantDrawerProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
  currency?: string;
}

export const AssistantDrawer: React.FC<AssistantDrawerProps> = ({
  eventId,
  isOpen,
  onClose,
  onDataChanged,
  currency = "INR",
}) => {
  const [messages, setMessages] = useState<AIConversationMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeProposal, setActiveProposal] = useState<{
    proposal: ActionProposal;
    messageId?: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/conversations`);
      const data = await res.json();
      if (data.data) {
        setMessages(data.data);
      }
    } catch (e) {
      console.error("Failed to load conversations", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen, eventId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (messageText: string) => {
    const text = messageText.trim();
    if (!text || isLoading) return;

    setInput("");
    setIsLoading(true);

    // Optimistic UI for user message
    const tempUserMsg: AIConversationMessage = {
      id: "temp_" + Date.now(),
      event_id: eventId,
      user_id: "me",
      role: "user",
      content: text,
      status: "NONE",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`/api/events/${eventId}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const json = await res.json();

      if (json.data) {
        const assistantMsg = json.data.message;
        setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), tempUserMsg, assistantMsg]);

        // If requires confirmation, open diff modal
        if (json.data.proposal?.requires_confirmation) {
          setActiveProposal({
            proposal: json.data.proposal,
            messageId: assistantMsg.id,
          });
        }
      }
    } catch (err) {
      console.error("Conversation error", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmOperations = async (messageId?: string, operations?: any[]) => {
    try {
      const res = await fetch(`/api/events/${eventId}/conversations/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, operations }),
      });
      if (res.ok) {
        await fetchMessages();
        onDataChanged(); // Re-sync entire dashboard
      }
    } catch (e) {
      console.error("Failed to apply proposed changes", e);
    }
  };

  const promptSuggestions = [
    "Reduce decoration by ₹20,000",
    "Increase guest count to 350 without increasing budget",
    "Add a task: Book traditional henna artist",
    "What is my remaining contingency budget?",
  ];

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 z-50 h-full w-full sm:w-[480px] bg-[#0E1015] border-l border-white/[0.08] flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#0A0B0E]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#DFC094] via-[#C5A880] to-[#8C6D3B] flex items-center justify-center text-[#0A0B0E] font-serif font-black text-xs shadow-md shadow-[#C5A880]/20">
              EP
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
                Private Event Concierge
              </h3>
              <p className="text-[10px] text-[#C5A880] tracking-wider uppercase">Director Consultation & Plan Revisions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close concierge"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-10 px-4 space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#1C1811] border border-[#C5A880]/30 text-[#C5A880] flex items-center justify-center mx-auto shadow-sm">
                <Compass className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-white tracking-tight">Atelier Concierge at Your Service</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed font-light">
                Request adjustments to capacity, reallocate floral or catering lines, or inquire about deadlines. Proposed modifications will be verified before applying.
              </p>
            </div>
          )}

          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`flex gap-3 text-xs ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-[#1C1811] border border-[#C5A880]/30 flex items-center justify-center text-[#C5A880] shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed space-y-2.5 ${
                    isUser
                      ? "bg-gradient-to-r from-[#D8B98A] via-[#C5A880] to-[#A88856] text-[#0A0B0E] font-medium rounded-tr-none shadow-md shadow-[#C5A880]/15"
                      : "bg-[#14161C] text-slate-200 rounded-tl-none border border-white/[0.08]"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {/* If message has a proposed diff */}
                  {!isUser && m.proposed_diff && (
                    <div className="mt-2 pt-2 border-t border-white/[0.08] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {m.status === "APPLIED" ? (
                          <Badge variant="emerald" className="gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Applied to plan</span>
                          </Badge>
                        ) : (
                          <Badge variant="amber">Requires confirmation</Badge>
                        )}
                      </div>
                      {m.status === "PENDING_CONFIRMATION" && (
                        <button
                          onClick={() =>
                            setActiveProposal({
                              proposal: m.proposed_diff!,
                              messageId: m.id,
                            })
                          }
                          className="text-[11px] font-semibold text-[#E6C79C] hover:text-white underline flex items-center gap-0.5"
                        >
                          Review Diff <ArrowUpRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2.5 items-center text-xs text-[#E6C79C] font-medium py-2">
              <Sparkles className="w-4 h-4 animate-pulse text-[#C5A880]" />
              <span>Analyzing variance & calculating allocations...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Suggestions */}
        <div className="p-3.5 border-t border-white/[0.08] bg-[#0A0B0E]/60">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#C5A880] mb-2">
            Suggested Consultations:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {promptSuggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s)}
                disabled={isLoading}
                className="text-[11px] bg-[#14161C] hover:bg-[#1E1B15] hover:border-[#C5A880]/50 border border-white/10 text-slate-300 hover:text-[#E8D5B5] rounded-full px-3 py-1 text-left transition-colors truncate max-w-full"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="p-3.5 border-t border-white/[0.08] bg-[#0E1015] flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Instruct the concierge (e.g. adjust guest count, reduce line item)..."
            className="flex-1 bg-[#14161C] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#C5A880] transition-colors"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || isLoading}
            className="rounded-xl px-3.5"
            aria-label="Send message"
          >
            <Send className="w-4 h-4 text-[#0A0B0E]" />
          </Button>
        </form>
      </div>

      {/* Diff Review Modal */}
      <DiffModal
        isOpen={Boolean(activeProposal)}
        onClose={() => setActiveProposal(null)}
        proposal={activeProposal?.proposal || null}
        messageId={activeProposal?.messageId}
        onConfirm={handleConfirmOperations}
        currency={currency}
      />
    </>
  );
};
