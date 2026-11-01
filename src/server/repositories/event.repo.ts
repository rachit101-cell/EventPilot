import crypto from "crypto";
import { query, queryOne, execute, transaction } from "@/lib/db";
import { EventItem, EventType, DatePrecision } from "@/types";

export class EventRepo {
  static create(data: {
    owner_id: string;
    name: string;
    event_type: EventType;
    date?: string | null;
    date_precision?: DatePrecision;
    city: string;
    country_code?: string;
    guest_count: number;
    currency?: string;
    style?: string;
    duration_hours?: number;
    food_preferences?: string[];
    special_requirements?: string[];
  }): EventItem {
    const id = crypto.randomUUID();
    const foodJson = JSON.stringify(data.food_preferences || []);
    const specialJson = JSON.stringify(data.special_requirements || []);

    execute(
      `INSERT INTO events (
        id, owner_id, name, event_type, date, date_precision, city, 
        country_code, guest_count, currency, status, style, duration_hours, 
        food_preferences, special_requirements
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PLANNING', ?, ?, ?, ?)`,
      [
        id,
        data.owner_id,
        data.name,
        data.event_type,
        data.date || null,
        data.date_precision || "EXACT",
        data.city,
        data.country_code || "IN",
        data.guest_count,
        data.currency || "INR",
        data.style || null,
        data.duration_hours || 6,
        foodJson,
        specialJson,
      ]
    );

    return EventRepo.findByIdAndOwner(id, data.owner_id)!;
  }

  static findByIdAndOwner(id: string, owner_id: string): EventItem | null {
    const row = queryOne<any>(
      "SELECT * FROM events WHERE id = ? AND owner_id = ?",
      [id, owner_id]
    );
    if (!row) return null;

    return {
      ...row,
      food_preferences: JSON.parse(row.food_preferences || "[]"),
      special_requirements: JSON.parse(row.special_requirements || "[]"),
    };
  }

  static listByOwner(owner_id: string): EventItem[] {
    const rows = query<any>(
      "SELECT * FROM events WHERE owner_id = ? ORDER BY created_at DESC",
      [owner_id]
    );
    return rows.map((row) => ({
      ...row,
      food_preferences: JSON.parse(row.food_preferences || "[]"),
      special_requirements: JSON.parse(row.special_requirements || "[]"),
    }));
  }

  static update(
    id: string,
    owner_id: string,
    fields: Partial<{
      name: string;
      date: string | null;
      date_precision: DatePrecision;
      city: string;
      guest_count: number;
      status: string;
      style: string;
      duration_hours: number;
    }>
  ): EventItem | null {
    const existing = EventRepo.findByIdAndOwner(id, owner_id);
    if (!existing) return null;

    const setClauses: string[] = [];
    const values: any[] = [];

    for (const [key, val] of Object.entries(fields)) {
      setClauses.push(`${key} = ?`);
      values.push(val);
    }

    if (setClauses.length === 0) return existing;

    setClauses.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    values.push(owner_id);

    execute(
      `UPDATE events SET ${setClauses.join(", ")} WHERE id = ? AND owner_id = ?`,
      values
    );

    return EventRepo.findByIdAndOwner(id, owner_id);
  }

  static delete(id: string, owner_id: string): boolean {
    const result = execute(
      "DELETE FROM events WHERE id = ? AND owner_id = ?",
      [id, owner_id]
    );
    return result.changes > 0;
  }
}
