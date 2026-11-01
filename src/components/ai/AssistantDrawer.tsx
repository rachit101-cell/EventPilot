"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DiffModal } from "./DiffModal";
import { AIConversationMessage, ActionProposal } from "@/types";
import { Sparkles, Send, X, ArrowUpRight, MessageSquare, Bot, User, CheckCircle2 } from "lucide-react";

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
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 z-50 h-full w-full sm:w-[460px] glass-card border-l border-slate-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-900/40">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                EventPilot Intelligence
              </h3>
              <p className="text-[11px] text-slate-400">Conversational Planner & Modification Assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close assistant"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8 px-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-950/50 border border-purple-800/40 text-purple-400 flex items-center justify-center mx-auto">
                <Bot className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-medium text-slate-200">Your AI Planning Partner</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Describe any updates, reductions, or questions. I perform impact analysis and verify budget
                calculations before applying changes to your plan.
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
                  <div className="w-7 h-7 rounded-lg bg-purple-900/60 border border-purple-700/50 flex items-center justify-center text-purple-300 shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed space-y-2 ${
                    isUser
                      ? "bg-purple-600 text-white rounded-tr-none shadow-md shadow-purple-950/30"
                      : "bg-slate-800/90 text-slate-200 rounded-tl-none border border-slate-700/70"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {/* If message has a proposed diff */}
                  {!isUser && m.proposed_diff && (
                    <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between gap-2">
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
                          className="text-[11px] font-semibold text-purple-300 hover:text-purple-200 underline flex items-center gap-0.5"
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
            <div className="flex gap-2.5 items-center text-xs text-purple-300 font-medium py-2">
              <Bot className="w-4 h-4 animate-pulse" />
              <span>Analyzing impact & calculating allocations...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Suggestions */}
        <div className="p-3 border-t border-slate-800/70 bg-slate-900/40">
          <p className="text-[11px] font-medium text-slate-400 mb-1.5">Quick Examples (Hackathon Demo):</p>
          <div className="flex flex-wrap gap-1.5">
            {promptSuggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s)}
                disabled={isLoading}
                className="text-[11px] bg-slate-800/90 hover:bg-purple-950/70 hover:border-purple-600/60 border border-slate-700 text-slate-300 hover:text-purple-200 rounded-full px-2.5 py-1 text-left transition-colors truncate max-w-full"
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
          className="p-3 border-t border-slate-800 bg-slate-900/80 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question or request a change..."
            className="flex-1 bg-slate-800 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || isLoading}
            className="rounded-xl px-3"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
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
