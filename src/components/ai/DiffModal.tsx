"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ActionProposal } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

export interface DiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: ActionProposal | null;
  messageId?: string;
  onConfirm: (messageId?: string, operations?: any[]) => Promise<void>;
  currency?: string;
}

export const DiffModal: React.FC<DiffModalProps> = ({
  isOpen,
  onClose,
  proposal,
  messageId,
  onConfirm,
  currency = "INR",
}) => {
  const [isApplying, setIsApplying] = useState(false);

  if (!proposal) return null;

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onConfirm(messageId, proposal.operations);
      onClose();
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review Proposed AI Changes"
      description="Inspect how these changes will update your budget, timeline, and plan before applying."
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        {/* Header Summary */}
        <div className="bg-purple-950/40 border border-purple-800/40 rounded-xl p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="purple">{proposal.intent}</Badge>
              <span className="text-xs text-purple-300 font-medium">Confidence: {Math.round(proposal.confidence * 100)}%</span>
            </div>
            <p className="text-sm text-slate-200 mt-1.5 leading-relaxed">{proposal.message}</p>
          </div>
        </div>

        {/* Warnings / Impact */}
        {proposal.impact_summary.warnings.length > 0 && (
          <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Operational & Capacity Considerations</span>
            </div>
            <ul className="text-xs text-amber-200/90 list-disc list-inside space-y-1 pl-1">
              {proposal.impact_summary.warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Operations Breakdown */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Proposed Structured Actions ({proposal.operations.length})
          </h4>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {proposal.operations.map((op, idx) => {
              if (op.op === "set_budget_category") {
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="capitalize font-medium text-slate-200">{op.params.category} Budget</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-purple-300 font-semibold">
                      <span>Set to {formatCurrency(op.params.amount_minor, currency)}</span>
                    </div>
                  </div>
                );
              }
              if (op.op === "adjust_guest_count") {
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                  >
                    <span className="font-medium text-slate-200">Guest Count</span>
                    <span className="font-mono text-emerald-300 font-semibold">Updated to {op.params.guest_count} guests</span>
                  </div>
                );
              }
              if (op.op === "add_task") {
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-200">New Task: {op.params.title}</span>
                      <Badge variant="blue">{op.params.priority}</Badge>
                    </div>
                    {op.params.due_at && <p className="text-[11px] text-slate-400">Due: {op.params.due_at}</p>}
                  </div>
                );
              }
              return (
                <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
                  <span className="font-medium">{op.op}</span>: {JSON.stringify(op.params)}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button variant="ghost" onClick={onClose} disabled={isApplying}>
            Discard
          </Button>
          <Button variant="primary" onClick={handleApply} isLoading={isApplying} className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm & Apply Changes</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
