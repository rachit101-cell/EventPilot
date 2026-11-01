"use client";

import React, { useState, useEffect, use } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { AssistantDrawer } from "@/components/ai/AssistantDrawer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";
import { Vendor, VendorStatus } from "@/types";
import {
  Users,
  Plus,
  Trash2,
  Phone,
  FileText,
  CreditCard,
  Sparkles,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function VendorsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [currency, setCurrency] = useState("INR");
  const [isLoading, setIsLoading] = useState(true);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Add Vendor Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [category, setCategory] = useState("Catering");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");
  const [advancePaid, setAdvancePaid] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVendors = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/vendors`);
      const json = await res.json();
      if (json.data) {
        setVendors(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [eventId]);

  const handleStatusChange = async (vendorId: string, newStatus: VendorStatus) => {
    try {
      await fetch(`/api/events/${eventId}/vendors`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, status: newStatus }),
      });
      fetchVendors();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    try {
      await fetch(`/api/events/${eventId}/vendors?vendorId=${vendorId}`, {
        method: "DELETE",
      });
      fetchVendors();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const qMinor = quoteAmount ? Math.round(parseFloat(quoteAmount.replace(/,/g, "")) * 100) : 0;
    const aMinor = advancePaid ? Math.round(parseFloat(advancePaid.replace(/,/g, "")) * 100) : 0;

    try {
      await fetch(`/api/events/${eventId}/vendors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          name: name.trim(),
          contact_info: contact.trim(),
          notes: notes.trim(),
          quote_amount_minor: qMinor,
          advance_paid_minor: aMinor,
        }),
      });

      setIsAddModalOpen(false);
      setName("");
      setContact("");
      setNotes("");
      setQuoteAmount("");
      setAdvancePaid("");
      fetchVendors();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute totals
  let totalQuoted = 0;
  let totalPaid = 0;
  for (const v of vendors) {
    if (v.quotes) {
      for (const q of v.quotes) {
        totalQuoted += q.amount_minor;
        totalPaid += q.advance_paid_minor;
      }
    }
  }
  const totalBalance = Math.max(0, totalQuoted - totalPaid);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar onOpenAssistant={() => setIsAssistantOpen(true)} />

      <div className="flex-1 flex">
        <Sidebar eventId={eventId} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Vendor Management</h1>
              <p className="text-xs text-slate-400 mt-1">
                Checklist requirements, real quotations entered by you, and advance payment tracking
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAssistantOpen(true)}
                className="gap-2 text-purple-300 border-purple-800"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Ask Vendor Advice</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                className="gap-2 shadow-purple-900/40"
              >
                <Plus className="w-4 h-4" />
                <span>Add Vendor / Quote</span>
              </Button>
            </div>
          </div>

          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="space-y-1">
              <span className="text-xs text-slate-400 font-medium">Total Quoted by Vendors</span>
              <div className="text-xl font-bold font-mono text-purple-300">
                {formatCurrency(totalQuoted, currency)}
              </div>
            </Card>

            <Card className="space-y-1">
              <span className="text-xs text-slate-400 font-medium">Advances Paid</span>
              <div className="text-xl font-bold font-mono text-emerald-300">
                {formatCurrency(totalPaid, currency)}
              </div>
            </Card>

            <Card className="space-y-1">
              <span className="text-xs text-slate-400 font-medium">Outstanding Vendor Balance</span>
              <div className="text-xl font-bold font-mono text-amber-300">
                {formatCurrency(totalBalance, currency)}
              </div>
            </Card>
          </div>

          {/* Vendors Table */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Vendor Roles & Checklists ({vendors.length})</span>
              </h2>
              <Badge variant="emerald">Zero Hallucination Guarantee</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 pl-2">Role / Partner</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Quoted Amount</th>
                    <th className="pb-3">Advance Paid</th>
                    <th className="pb-3">Balance Due</th>
                    <th className="pb-3 pr-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {vendors.map((v) => {
                    const quote = v.quotes?.[0];
                    const qAmount = quote?.amount_minor || 0;
                    const aPaid = quote?.advance_paid_minor || 0;
                    const bal = Math.max(0, qAmount - aPaid);

                    return (
                      <tr key={v.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 pl-2">
                          <div className="font-semibold text-slate-200">{v.name}</div>
                          {v.contact_info && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-500" /> {v.contact_info}
                            </div>
                          )}
                          {v.notes && <div className="text-[10px] text-slate-500 mt-0.5">{v.notes}</div>}
                        </td>

                        <td className="py-3 text-slate-300 capitalize font-medium">{v.category}</td>

                        <td className="py-3">
                          <select
                            value={v.status}
                            onChange={(e) => handleStatusChange(v.id, e.target.value as VendorStatus)}
                            className="bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-xs text-slate-200"
                          >
                            <option value="NOT_STARTED">Not Started</option>
                            <option value="CONTACTED">Contacted</option>
                            <option value="SHORTLISTED">Shortlisted</option>
                            <option value="BOOKED">Booked</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                        </td>

                        <td className="py-3 font-mono text-slate-200">
                          {qAmount > 0 ? formatCurrency(qAmount, currency) : "-"}
                        </td>

                        <td className="py-3 font-mono text-emerald-400">
                          {aPaid > 0 ? formatCurrency(aPaid, currency) : "-"}
                        </td>

                        <td className="py-3 font-mono text-amber-300 font-semibold">
                          {qAmount > 0 ? formatCurrency(bal, currency) : "-"}
                        </td>

                        <td className="py-3 pr-2 text-right">
                          <button
                            onClick={() => handleDeleteVendor(v.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                            aria-label="Delete vendor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </main>
      </div>

      {/* Add Vendor Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Vendor Partner or Quote"
        description="Enter vendor name, confirmed quotation, and payment details."
      >
        <form onSubmit={handleAddVendor} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-2.5 text-xs text-slate-100"
              >
                <option value="Venue">Venue</option>
                <option value="Catering">Catering</option>
                <option value="Decoration">Decoration</option>
                <option value="Photography">Photography</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Transportation">Transportation</option>
                <option value="Invitations">Invitations</option>
                <option value="Makeup & Styling">Makeup & Styling</option>
              </select>
            </div>

            <Input
              label="Vendor / Firm Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Royal Palace Banquet"
            />
          </div>

          <Input
            label="Contact Info (Phone / Email)"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="+91 98765 43210"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quote Amount (in INR)"
              type="number"
              value={quoteAmount}
              onChange={(e) => setQuoteAmount(e.target.value)}
              placeholder="e.g. 150000"
            />
            <Input
              label="Advance Paid (in INR)"
              type="number"
              value={advancePaid}
              onChange={(e) => setAdvancePaid(e.target.value)}
              placeholder="e.g. 30000"
            />
          </div>

          <Input
            label="Notes / Terms"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Includes air conditioning and bridal suite access"
          />

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="ghost" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Save Vendor
            </Button>
          </div>
        </form>
      </Modal>

      <AssistantDrawer
        eventId={eventId}
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onDataChanged={fetchVendors}
      />
    </div>
  );
}
