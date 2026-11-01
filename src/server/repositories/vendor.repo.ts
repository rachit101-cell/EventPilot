import crypto from "crypto";
import { query, queryOne, execute, transaction } from "@/lib/db";
import { Vendor, VendorQuote, VendorStatus } from "@/types";

export class VendorRepo {
  static createVendor(data: {
    eventId: string;
    category: string;
    name: string;
    contact_info?: string;
    status?: VendorStatus;
    notes?: string;
  }): Vendor {
    const id = crypto.randomUUID();
    execute(
      `INSERT INTO vendors (id, event_id, category, name, contact_info, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.eventId,
        data.category,
        data.name,
        data.contact_info || null,
        data.status || "NOT_STARTED",
        data.notes || null,
      ]
    );

    return VendorRepo.findById(id)!;
  }

  static findById(id: string): Vendor | null {
    const row = queryOne<Vendor>("SELECT * FROM vendors WHERE id = ?", [id]);
    if (!row) return null;
    const quotes = query<VendorQuote>(
      "SELECT * FROM vendor_quotes WHERE vendor_id = ? ORDER BY created_at DESC",
      [id]
    );
    return { ...row, quotes };
  }

  static getVendorsByEventId(eventId: string): Vendor[] {
    const rows = query<Vendor>("SELECT * FROM vendors WHERE event_id = ? ORDER BY category ASC, name ASC", [eventId]);
    return rows.map((v) => {
      const quotes = query<VendorQuote>(
        "SELECT * FROM vendor_quotes WHERE vendor_id = ? ORDER BY created_at DESC",
        [v.id]
      );
      return { ...v, quotes };
    });
  }

  static updateVendorStatus(id: string, eventId: string, status: VendorStatus): boolean {
    const res = execute(
      "UPDATE vendors SET status = ? WHERE id = ? AND event_id = ?",
      [status, id, eventId]
    );
    return res.changes > 0;
  }

  static addQuote(data: {
    vendorId: string;
    amountMinor: number;
    currency?: string;
    advancePaidMinor?: number;
    quoteDate?: string;
    notes?: string;
  }): VendorQuote {
    const id = crypto.randomUUID();
    execute(
      `INSERT INTO vendor_quotes (id, vendor_id, amount_minor, currency, advance_paid_minor, quote_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.vendorId,
        data.amountMinor,
        data.currency || "INR",
        data.advancePaidMinor || 0,
        data.quoteDate || new Date().toISOString().split("T")[0],
        data.notes || null,
      ]
    );

    return queryOne<VendorQuote>("SELECT * FROM vendor_quotes WHERE id = ?", [id])!;
  }

  static deleteVendor(id: string, eventId: string): boolean {
    const res = execute("DELETE FROM vendors WHERE id = ? AND event_id = ?", [id, eventId]);
    return res.changes > 0;
  }
}
