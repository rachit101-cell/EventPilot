import { z } from "zod";

export const OnboardingExtractionSchema = z.object({
  event_type: z.enum(["WEDDING", "BIRTHDAY", "COMMUNITY"]).nullable(),
  name: z.string().nullable(),
  date: z.string().nullable(),
  date_precision: z.enum(["EXACT", "APPROXIMATE", "MONTH_YEAR", "SEASON"]).default("EXACT"),
  city: z.string().nullable(),
  country_code: z.string().default("IN"),
  guest_count: z.number().int().positive().nullable(),
  budget_minor: z.number().int().nonnegative().nullable(),
  currency: z.string().default("INR"),
  style: z.string().nullable(),
  duration_hours: z.number().positive().nullable(),
  food_preferences: z.array(z.string()).default([]),
  special_requirements: z.array(z.string()).default([]),
  confirmed_fields: z.array(z.string()).default([]),
  missing_fields: z.array(z.string()).default([]),
  follow_up_questions: z.array(z.string()).max(3).default([]),
  contradictions: z.array(z.string()).default([]),
});

export type OnboardingExtraction = z.infer<typeof OnboardingExtractionSchema>;

export const PlanGenerationSchema = z.object({
  summary: z.string(),
  suggested_theme: z.string(),
  budget_ratios: z.array(
    z.object({
      category: z.enum([
        "venue",
        "catering",
        "decoration",
        "photography",
        "entertainment",
        "transportation",
        "invitations",
        "miscellaneous",
        "contingency",
      ]),
      percentage: z.number().min(0).max(100),
      reasoning: z.string(),
    })
  ),
  milestones: z.array(
    z.object({
      title: z.string(),
      offset_days: z.number().int(),
    })
  ),
  tasks: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      relative_offset_days: z.number().int(),
      priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
      category: z.string(),
    })
  ),
  vendors: z.array(
    z.object({
      category: z.string(),
      role: z.string(),
      notes: z.string(),
    })
  ),
  ideas: z.array(
    z.object({
      kind: z.enum(["theme", "catering", "experience", "logistics"]),
      title: z.string(),
      description: z.string(),
      cost_range: z.string(),
    })
  ),
});

export type PlanGeneration = z.infer<typeof PlanGenerationSchema>;

export const ActionProposalSchema = z.object({
  intent: z.enum([
    "UPDATE_EVENT",
    "UPDATE_BUDGET",
    "ADD_TASK",
    "UPDATE_TASK",
    "ADD_VENDOR",
    "UPDATE_VENDOR",
    "GENERATE_IDEAS",
    "REGENERATE_PLAN",
    "QUESTION",
  ]),
  confidence: z.number().min(0).max(1),
  requires_confirmation: z.boolean(),
  message: z.string(),
  impact_summary: z.object({
    budget_change_minor: z.number().default(0),
    affected_categories: z.array(z.string()).default([]),
    affected_milestones: z.array(z.string()).default([]),
    warnings: z.array(z.string()).default([]),
  }),
  operations: z.array(
    z.object({
      op: z.string(),
      params: z.record(z.any()),
    })
  ),
});

export type ActionProposalOutput = z.infer<typeof ActionProposalSchema>;
