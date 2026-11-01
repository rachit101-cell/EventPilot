import fs from "fs";
import path from "path";

// Note: Using node:sqlite DatabaseSync for zero-dependency native SQLite
// Dynamically imported or required to ensure compatibility with Next.js edge/server bundling
let dbInstance: any = null;

export function getDb(): any {
  if (dbInstance) {
    return dbInstance;
  }

  // Determine database file path
  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "eventpilot.db");
  const dbDir = path.dirname(dbPath);

  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  } catch (err) {
    console.warn("Could not create database directory, falling back to in-memory/temp database", err);
  }

  // Load DatabaseSync
  const { DatabaseSync } = require("node:sqlite");
  
  try {
    dbInstance = new DatabaseSync(dbPath);
  } catch (e) {
    console.warn("Falling back to :memory: SQLite database", e);
    dbInstance = new DatabaseSync(":memory:");
  }

  // Enable foreign keys and WAL mode for reliability
  dbInstance.exec("PRAGMA foreign_keys = ON;");

  // Run initial schema migration
  initSchema(dbInstance);

  return dbInstance;
}

function initSchema(db: any) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      event_type TEXT CHECK(event_type IN ('WEDDING', 'BIRTHDAY', 'COMMUNITY')) NOT NULL,
      date TEXT,
      date_precision TEXT CHECK(date_precision IN ('EXACT', 'APPROXIMATE', 'MONTH_YEAR', 'SEASON')) DEFAULT 'EXACT',
      city TEXT NOT NULL,
      country_code TEXT DEFAULT 'IN',
      guest_count INTEGER NOT NULL,
      currency TEXT DEFAULT 'INR',
      status TEXT CHECK(status IN ('DRAFT', 'PLANNING', 'CONFIRMED', 'COMPLETED')) DEFAULT 'PLANNING',
      style TEXT,
      duration_hours INTEGER,
      food_preferences TEXT, -- JSON array
      special_requirements TEXT, -- JSON array
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      event_id TEXT UNIQUE NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      total_minor INTEGER NOT NULL,
      currency TEXT DEFAULT 'INR',
      contingency_minor INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS budget_categories (
      id TEXT PRIMARY KEY,
      budget_id TEXT NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      estimated_minor INTEGER NOT NULL,
      actual_minor INTEGER DEFAULT 0,
      source TEXT CHECK(source IN ('ai_generated', 'user_entered', 'system_calculated')) DEFAULT 'ai_generated',
      locked INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      estimated_minor INTEGER DEFAULT 0,
      actual_minor INTEGER NOT NULL,
      currency TEXT DEFAULT 'INR',
      status TEXT CHECK(status IN ('PLANNED', 'PENDING', 'PAID')) DEFAULT 'PAID',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      due_at TEXT,
      relative_offset_days INTEGER,
      status TEXT CHECK(status IN ('TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED')) DEFAULT 'TODO',
      priority TEXT CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')) DEFAULT 'MEDIUM',
      dependency_ids TEXT DEFAULT '[]',
      source TEXT DEFAULT 'ai_generated',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS timeline_milestones (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      due_at TEXT NOT NULL,
      locked INTEGER DEFAULT 0,
      status TEXT CHECK(status IN ('UPCOMING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE')) DEFAULT 'UPCOMING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vendors (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      contact_info TEXT,
      status TEXT CHECK(status IN ('NOT_STARTED', 'CONTACTED', 'SHORTLISTED', 'BOOKED', 'COMPLETED')) DEFAULT 'NOT_STARTED',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vendor_quotes (
      id TEXT PRIMARY KEY,
      vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
      amount_minor INTEGER NOT NULL,
      currency TEXT DEFAULT 'INR',
      advance_paid_minor INTEGER DEFAULT 0,
      quote_date TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ai_conversations (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT CHECK(role IN ('user', 'assistant', 'system')) NOT NULL,
      content TEXT NOT NULL,
      intent TEXT,
      proposed_diff TEXT,
      status TEXT CHECK(status IN ('PENDING_CONFIRMATION', 'APPLIED', 'REJECTED', 'NONE')) DEFAULT 'NONE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ai_recommendations (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      cost_range TEXT,
      source TEXT DEFAULT 'ai_generated',
      dismissed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      actor_id TEXT NOT NULL REFERENCES users(id),
      action TEXT NOT NULL,
      before_json TEXT,
      after_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for fast joins and scoping
    CREATE INDEX IF NOT EXISTS idx_events_owner ON events(owner_id);
    CREATE INDEX IF NOT EXISTS idx_budget_event ON budgets(event_id);
    CREATE INDEX IF NOT EXISTS idx_categories_budget ON budget_categories(budget_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_event ON tasks(event_id);
    CREATE INDEX IF NOT EXISTS idx_milestones_event ON timeline_milestones(event_id);
    CREATE INDEX IF NOT EXISTS idx_vendors_event ON vendors(event_id);
    CREATE INDEX IF NOT EXISTS idx_quotes_vendor ON vendor_quotes(vendor_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_event ON ai_conversations(event_id);
    CREATE INDEX IF NOT EXISTS idx_recommendations_event ON ai_recommendations(event_id);
  `);
}

// Helpers for type-safe queries
export function query<T = any>(sql: string, params: any[] = []): T[] {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.all(...params) as T[];
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const db = getDb();
  const stmt = db.prepare(sql);
  const result = stmt.get(...params);
  return (result as T) || null;
}

export function execute(sql: string, params: any[] = []): { changes: number; lastInsertRowid: any } {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

export function transaction<T>(fn: () => T): T {
  const db = getDb();
  db.exec("BEGIN TRANSACTION;");
  try {
    const result = fn();
    db.exec("COMMIT;");
    return result;
  } catch (error) {
    db.exec("ROLLBACK;");
    throw error;
  }
}
