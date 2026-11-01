import crypto from "crypto";
import { query, queryOne, execute } from "@/lib/db";
import { AIConversationMessage, AIRecommendation, ActionProposal } from "@/types";

export class ConversationRepo {
  static addMessage(data: {
    eventId: string;
    userId: string;
    role: "user" | "assistant" | "system";
    content: string;
    intent?: string;
    proposed_diff?: ActionProposal | null;
    status?: "PENDING_CONFIRMATION" | "APPLIED" | "REJECTED" | "NONE";
  }): AIConversationMessage {
    const id = crypto.randomUUID();
    const diffJson = data.proposed_diff ? JSON.stringify(data.proposed_diff) : null;

    execute(
      `INSERT INTO ai_conversations (
        id, event_id, user_id, role, content, intent, proposed_diff, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.eventId,
        data.userId,
        data.role,
        data.content,
        data.intent || null,
        diffJson,
        data.status || "NONE",
      ]
    );

    return ConversationRepo.findById(id)!;
  }

  static findById(id: string): AIConversationMessage | null {
    const row = queryOne<any>("SELECT * FROM ai_conversations WHERE id = ?", [id]);
    if (!row) return null;
    return {
      ...row,
      proposed_diff: row.proposed_diff ? JSON.parse(row.proposed_diff) : null,
    };
  }

  static getMessagesByEventId(eventId: string): AIConversationMessage[] {
    const rows = query<any>(
      "SELECT * FROM ai_conversations WHERE event_id = ? ORDER BY created_at ASC",
      [eventId]
    );
    return rows.map((r) => ({
      ...r,
      proposed_diff: r.proposed_diff ? JSON.parse(r.proposed_diff) : null,
    }));
  }

  static updateMessageStatus(
    id: string,
    status: "PENDING_CONFIRMATION" | "APPLIED" | "REJECTED" | "NONE"
  ): boolean {
    const res = execute("UPDATE ai_conversations SET status = ? WHERE id = ?", [status, id]);
    return res.changes > 0;
  }

  static addRecommendation(data: {
    eventId: string;
    kind: "theme" | "catering" | "experience" | "logistics";
    title: string;
    description: string;
    cost_range?: string;
    source?: "ai_generated" | "user_entered" | "system_calculated";
  }): AIRecommendation {
    const id = crypto.randomUUID();
    execute(
      `INSERT INTO ai_recommendations (id, event_id, kind, title, description, cost_range, source, dismissed)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        id,
        data.eventId,
        data.kind,
        data.title,
        data.description,
        data.cost_range || null,
        data.source || "ai_generated",
      ]
    );

    return queryOne<AIRecommendation>("SELECT * FROM ai_recommendations WHERE id = ?", [id])!;
  }

  static getRecommendationsByEventId(eventId: string): AIRecommendation[] {
    const rows = query<any>(
      "SELECT * FROM ai_recommendations WHERE event_id = ? AND dismissed = 0 ORDER BY created_at DESC",
      [eventId]
    );
    return rows.map((r) => ({
      ...r,
      dismissed: Boolean(r.dismissed),
    }));
  }

  static dismissRecommendation(id: string, eventId: string): boolean {
    const res = execute(
      "UPDATE ai_recommendations SET dismissed = 1 WHERE id = ? AND event_id = ?",
      [id, eventId]
    );
    return res.changes > 0;
  }

  static logAudit(data: {
    eventId: string;
    actorId: string;
    action: string;
    before?: any;
    after?: any;
  }) {
    const id = crypto.randomUUID();
    execute(
      "INSERT INTO audit_events (id, event_id, actor_id, action, before_json, after_json) VALUES (?, ?, ?, ?, ?, ?)",
      [
        id,
        data.eventId,
        data.actorId,
        data.action,
        data.before ? JSON.stringify(data.before) : null,
        data.after ? JSON.stringify(data.after) : null,
      ]
    );
  }
}
