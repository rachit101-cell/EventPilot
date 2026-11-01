export type EventType = 'WEDDING' | 'BIRTHDAY' | 'COMMUNITY';
export type DatePrecision = 'EXACT' | 'APPROXIMATE' | 'MONTH_YEAR' | 'SEASON';
export type EventStatus = 'DRAFT' | 'PLANNING' | 'CONFIRMED' | 'COMPLETED';

export type BudgetCategoryName = 
  | 'venue'
  | 'catering'
  | 'decoration'
  | 'photography'
  | 'entertainment'
  | 'transportation'
  | 'invitations'
  | 'miscellaneous'
  | 'contingency';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type MilestoneStatus = 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
export type VendorStatus = 'NOT_STARTED' | 'CONTACTED' | 'SHORTLISTED' | 'BOOKED' | 'COMPLETED';
export type ProvenanceSource = 'ai_generated' | 'user_entered' | 'system_calculated';

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface EventItem {
  id: string;
  owner_id: string;
  name: string;
  event_type: EventType;
  date: string | null;
  date_precision: DatePrecision;
  city: string;
  country_code: string;
  guest_count: number;
  currency: string;
  status: EventStatus;
  style?: string;
  duration_hours?: number;
  food_preferences?: string[];
  special_requirements?: string[];
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  event_id: string;
  total_minor: number;
  currency: string;
  contingency_minor: number;
  created_at: string;
}

export interface BudgetCategory {
  id: string;
  budget_id: string;
  category: BudgetCategoryName;
  estimated_minor: number;
  actual_minor: number;
  source: ProvenanceSource;
  locked: boolean;
  created_at: string;
}

export interface Expense {
  id: string;
  event_id: string;
  category: BudgetCategoryName;
  description: string;
  estimated_minor: number;
  actual_minor: number;
  currency: string;
  status: 'PLANNED' | 'PENDING' | 'PAID';
  created_at: string;
}

export interface Task {
  id: string;
  event_id: string;
  title: string;
  description?: string;
  due_at?: string | null;
  relative_offset_days?: number | null;
  status: TaskStatus;
  priority: TaskPriority;
  dependency_ids: string[];
  source: ProvenanceSource;
  created_at: string;
}

export interface TimelineMilestone {
  id: string;
  event_id: string;
  title: string;
  due_at: string;
  locked: boolean;
  status: MilestoneStatus;
  created_at: string;
}

export interface Vendor {
  id: string;
  event_id: string;
  category: string;
  name: string;
  contact_info?: string;
  status: VendorStatus;
  notes?: string;
  quotes?: VendorQuote[];
  created_at: string;
}

export interface VendorQuote {
  id: string;
  vendor_id: string;
  amount_minor: number;
  currency: string;
  advance_paid_minor: number;
  quote_date?: string;
  notes?: string;
  created_at: string;
}

export interface AIRecommendation {
  id: string;
  event_id: string;
  kind: 'theme' | 'catering' | 'experience' | 'logistics';
  title: string;
  description: string;
  cost_range?: string;
  source: ProvenanceSource;
  dismissed: boolean;
  created_at: string;
}

export interface AIConversationMessage {
  id: string;
  event_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  intent?: string;
  proposed_diff?: ActionProposal | null;
  status: 'PENDING_CONFIRMATION' | 'APPLIED' | 'REJECTED' | 'NONE';
  created_at: string;
}

export interface ActionOperation {
  op: string;
  params: Record<string, any>;
}

export interface ActionProposal {
  intent: 
    | 'UPDATE_EVENT' 
    | 'UPDATE_BUDGET' 
    | 'ADD_TASK' 
    | 'UPDATE_TASK' 
    | 'ADD_VENDOR' 
    | 'UPDATE_VENDOR' 
    | 'GENERATE_IDEAS' 
    | 'REGENERATE_PLAN' 
    | 'QUESTION';
  confidence: number;
  requires_confirmation: boolean;
  message: string;
  impact_summary: {
    budget_change_minor: number;
    affected_categories: string[];
    affected_milestones: string[];
    warnings: string[];
  };
  operations: ActionOperation[];
}

export interface DashboardProjection {
  event: EventItem;
  budget: {
    total_minor: number;
    currency: string;
    allocated_minor: number;
    actual_spent_minor: number;
    remaining_minor: number;
    contingency_minor: number;
    is_over_budget: boolean;
    categories: BudgetCategory[];
    expenses: Expense[];
  };
  timeline: {
    milestones: TimelineMilestone[];
    tasks: Task[];
    completed_task_count: number;
    total_task_count: number;
    overdue_task_count: number;
  };
  vendors: {
    checklist: Vendor[];
    total_quoted_minor: number;
    total_paid_minor: number;
    total_balance_minor: number;
  };
  recommendations: AIRecommendation[];
  recent_conversations: AIConversationMessage[];
}

export interface ApiResponse<T = any> {
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: any;
  } | null;
  request_id: string;
}
