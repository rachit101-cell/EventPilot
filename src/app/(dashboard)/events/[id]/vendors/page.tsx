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
import { ClientCache } from "@/lib/client-cache";
import { Vendor, VendorStatus, DashboardProjection } from "@/types";
import {
  Users,
  Plus,
  Trash2,
  Phone,
  Sparkles,
  Loader2,
} from "lucide-react";

export default function VendorsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  // Instant SWR cache read
  const cachedDashboard = ClientCache.get<DashboardProjection>(`dashboard_${eventId}`);
  const cachedVendors = ClientCache.get<Vendor[]>(`vendors_${eventId}`);

  const [vendors, setVendors] = useState<Vendor[]>(cachedVendors || cachedDashboard?.vendors?.checklist || []);
  const [currency, setCurrency] = useState(cachedDashboard?.budget?.currency || "INR");
  const [isLoading, setIsLoading] = useState(!cachedVendors && !cachedDashboard);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
      const [vRes, eRes] = await Promise.all([
        fetch(`/api/events/${eventId}/vendors`),
        fetch(`/api/events/${eventId}/dashboard`),
      ]);
      const vJson = await vRes.json();
      const eJson = await eRes.json();

      if (vJson.data) {
        setVendors(vJson.data);
        ClientCache.set(`vendors_${eventId}`, vJson.data);
      }
      if (eJson.data?.budget?.currency) {
        setCurrency(eJson.data.budget.currency);
        ClientCache.set(`dashboard_${eventId}`, eJson.data);
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
    // Optimistic UI update
    setVendors((prev) =>
      prev.map((v) => (v.id === vendorId ? { ...v, status: newStatus } : v))
    );

    try {
      await fetch(`/api/events/${eventId}/vendors`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, status: newStatus }),
      });
      ClientCache.invalidate(`vendors_${eventId}`);
      ClientCache.invalidate(`dashboard_${eventId}`);
      fetchVendors();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    setConfirmDeleteId(null);
    setVendors((prev) => prev.filter((v) => v.id !== vendorId));
    try {
      await fetch(`/api/events/${eventId}/vendors?vendorId=${vendorId}`, {
        method: "DELETE",
      });
      ClientCache.invalidate(`vendors_${eventId}`);
      ClientCache.invalidate(`dashboard_${eventId}`);
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
      ClientCache.invalidate(`vendors_${eventId}`);
      ClientCache.invalidate(`dashboard_${eventId}`);
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

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#05070E]">
      <Navbar onOpenAssistant={() => setIsAssistantOpen(true)} />

      <div className="flex-1 flex">
        <Sidebar eventId={eventId} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#C5A880]">
                  Partner Directory
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Curated Vendor Partners</h1>
              <p className="text-xs text-slate-400 mt-1">
                Role requirements, confirmed quotations, and advance commitment tracking.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAssistantOpen(true)}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#C5A880]" />
                <span>Consult on Vendors</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                className="gap-2 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Add Partner / Quote</span>
              </Button>
            </div>
          </div>

          {isLoading && vendors.length === 0 ? (
            <div className="space-y-6 animate-pulse">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="h-20 bg-[#0D111A]/80 rounded-2xl border border-white/[0.08]" />
                <div className="h-20 bg-[#0D111A]/80 rounded-2xl border border-white/[0.08]" />
                <div className="h-20 bg-[#0D111A]/80 rounded-2xl border border-white/[0.08]" />
              </div>
              <div className="h-64 bg-[#0D111A]/80 rounded-2xl border border-white/[0.08]" />
            </div>
          ) : (
            <>
              {/* Top Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="space-y-1 border border-white/[0.08]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Quoted Commitments</span>
                  <div className="text-xl font-bold font-mono text-[#E6C79C]">
                    {formatCurrency(totalQuoted, currency)}
                  </div>
                </Card>

                <Card className="space-y-1 border border-white/[0.08]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Advances Disbursed</span>
                  <div className="text-xl font-bold font-mono text-[#7CE4B5]">
                    {formatCurrency(totalPaid, currency)}
                  </div>
                </Card>

                <Card className="space-y-1 border border-white/[0.08]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Outstanding Balance Due</span>
                  <div className="text-xl font-bold font-mono text-amber-300">
                    {formatCurrency(totalBalance, currency)}
                  </div>
                </Card>
              </div>

              {/* Vendors Table */}
              <Card className="space-y-4 border border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#C5A880]" />
                    <span>Partner Categories & Roles ({vendors.length})</span>
                  </h2>
                  <Badge variant="gold">Verified Specifications</Badge>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="pb-3 pl-2">Role / Firm</th>
                        <th className="pb-3">Category</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Quoted Amount</th>
                        <th className="pb-3">Advance Paid</th>
                        <th className="pb-3">Balance Due</th>
                        <th className="pb-3 pr-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {vendors.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-xs text-slate-400">
                            No partners added yet. Generate a master plan first or click &ldquo;Add Partner / Quote&rdquo; to begin.
                          </td>
                        </tr>
                      ) : (
                        vendors.map((v) => {
                          const quote = v.quotes?.[0];
                          const qAmount = quote?.amount_minor || 0;
                          const aPaid = quote?.advance_paid_minor || 0;
                          const bal = Math.max(0, qAmount - aPaid);

                          return (
                            <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 pl-2">
                                <div className="font-semibold text-slate-200">{v.name}</div>
                                {v.contact_info && (
                                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                    <Phone className="w-3 h-3 text-[#C5A880]" /> {v.contact_info}
                                  </div>
                                )}
                                {v.notes && <div className="text-[10px] text-slate-400 mt-0.5 font-light">{v.notes}</div>}
                              </td>

                              <td className="py-3 text-slate-300 capitalize font-medium">{v.category}</td>

                              <td className="py-3">
                                <select
                                  value={v.status}
                                  onChange={(e) => handleStatusChange(v.id, e.target.value as VendorStatus)}
                                  className="bg-[#101217] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-[#C5A880]"
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

                              <td className="py-3 font-mono text-[#7CE4B5]">
                                {aPaid > 0 ? formatCurrency(aPaid, currency) : "-"}
                              </td>

                              <td className="py-3 font-mono text-amber-300 font-semibold">
                                {qAmount > 0 ? formatCurrency(bal, currency) : "-"}
                              </td>

                              <td className="py-3 pr-2 text-right">
                                {confirmDeleteId === v.id ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => handleDeleteVendor(v.id)}
                                      className="text-[11px] text-rose-400 font-semibold hover:text-rose-300 px-2 py-0.5"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="text-[11px] text-slate-500 hover:text-slate-300"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmDeleteId(v.id)}
                                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                                    aria-label="Delete vendor"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </main>
      </div>

      {/* Add Vendor Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Vendor Partner or Quote"
        description="Enter partner firm details, confirmed quotation, and payment terms."
      >
        <form onSubmit={handleAddVendor} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium tracking-wider uppercase text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#101217] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-[#C5A880]"
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
              label="Partner / Firm Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Royal Palace Banquet"
            />
          </div>

          <Input
            label="Direct Contact (Phone / Email)"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="+91 98765 43210"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={`Quote Amount (${currency})`}
              type="number"
              value={quoteAmount}
              onChange={(e) => setQuoteAmount(e.target.value)}
              placeholder="e.g. 150000"
            />
            <Input
              label={`Advance Paid (${currency})`}
              type="number"
              value={advancePaid}
              onChange={(e) => setAdvancePaid(e.target.value)}
              placeholder="e.g. 30000"
            />
          </div>

          <Input
            label="Operational Terms & Scope"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Includes air conditioning and bridal suite access"
          />

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="ghost" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Save Partner
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
