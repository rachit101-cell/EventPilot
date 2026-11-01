import {
  OnboardingExtractionSchema,
  OnboardingExtraction,
  PlanGenerationSchema,
  PlanGeneration,
  ActionProposalSchema,
  ActionProposalOutput,
} from "./schemas";
import {
  getExtractionPrompt,
  getPlanGenerationPrompt,
  getModificationPrompt,
} from "./prompts";
import { BudgetService } from "../domain/budget.service";
import { TimelineService } from "../domain/timeline.service";
import { ModificationService } from "../domain/modification.service";

export class AIAdapter {
  private static async callLLM(prompt: string): Promise<string | null> {
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // 1. Try Gemini if configured
    if (geminiKey && geminiKey.trim() !== "") {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2,
            },
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text;
        }
      } catch (err) {
        console.warn("Gemini call failed, falling back to local heuristic engine", err);
      }
    }

    // 2. Try OpenAI if configured
    if (openaiKey && openaiKey.trim() !== "") {
      try {
        const url = "https://api.openai.com/v1/chat/completions";
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.2,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const text = json?.choices?.[0]?.message?.content;
          if (text) return text;
        }
      } catch (err) {
        console.warn("OpenAI call failed, falling back to local heuristic engine", err);
      }
    }

    return null;
  }

  /**
   * Extract event requirements from natural language
   */
  static async extractOnboarding(
    userInput: string,
    existingContext: any = {}
  ): Promise<OnboardingExtraction> {
    const prompt = getExtractionPrompt(userInput, existingContext);
    const raw = await this.callLLM(prompt);

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const validated = OnboardingExtractionSchema.safeParse(parsed);
        if (validated.success) {
          return validated.data;
        }
      } catch (e) {
        console.warn("LLM extraction parse error", e);
      }
    }

    // Deterministic Heuristic Engine Fallback
    return this.heuristicExtraction(userInput, existingContext);
  }

  /**
   * Generate structured plan
   */
  static async generatePlan(eventContext: any): Promise<PlanGeneration> {
    const prompt = getPlanGenerationPrompt(eventContext);
    const raw = await this.callLLM(prompt);

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const validated = PlanGenerationSchema.safeParse(parsed);
        if (validated.success) {
          return validated.data;
        }
      } catch (e) {
        console.warn("LLM plan generation parse error", e);
      }
    }

    // Deterministic Domain Generator Fallback
    return this.heuristicPlanGeneration(eventContext);
  }

  /**
   * Process conversational modification
   */
  static async processModification(
    userMessage: string,
    currentEventState: any
  ): Promise<ActionProposalOutput> {
    const prompt = getModificationPrompt(userMessage, currentEventState);
    const raw = await this.callLLM(prompt);

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const validated = ActionProposalSchema.safeParse(parsed);
        if (validated.success) {
          return validated.data;
        }
      } catch (e) {
        console.warn("LLM modification parse error", e);
      }
    }

    // Deterministic Heuristic Intent Processor
    return this.heuristicModification(userMessage, currentEventState);
  }

  // --- HEURISTIC ENGINES (Guarantees 100% resilient hackathon execution) ---

  private static heuristicExtraction(input: string, context: any): OnboardingExtraction {
    const lower = input.toLowerCase();

    // Event type
    let eventType: "WEDDING" | "BIRTHDAY" | "COMMUNITY" | null = context.event_type || null;
    if (lower.includes("wedding") || lower.includes("marriage") || lower.includes("reception") || lower.includes("shaadi")) {
      eventType = "WEDDING";
    } else if (lower.includes("birthday") || lower.includes("bday") || lower.includes("party")) {
      eventType = "BIRTHDAY";
    } else if (lower.includes("community") || lower.includes("conference") || lower.includes("festival") || lower.includes("meetup")) {
      eventType = "COMMUNITY";
    }

    // Guest count
    let guests: number | null = context.guest_count || null;
    const guestMatch = lower.match(/(\d+)\s*(guests?|people|pax|attendees)/i);
    if (guestMatch) {
      guests = parseInt(guestMatch[1], 10);
    } else {
      const anyNumber = lower.match(/\b(\d{2,4})\b/);
      if (anyNumber && !guests) {
        guests = parseInt(anyNumber[1], 10);
      }
    }

    // Budget: detects lakhs, crores, or numeric with ₹ / INR / Rs
    let budgetMinor: number | null = context.budget_minor || null;
    const lakhMatch = lower.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?|l)/i);
    const croreMatch = lower.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:crores?|cr)/i);
    const directMoney = lower.match(/(?:₹|rs\.?|inr)\s*([\d,]+)/i);

    if (lakhMatch) {
      const lakhs = parseFloat(lakhMatch[1]);
      budgetMinor = Math.round(lakhs * 100000 * 100);
    } else if (croreMatch) {
      const cr = parseFloat(croreMatch[1]);
      budgetMinor = Math.round(cr * 10000000 * 100);
    } else if (directMoney) {
      const val = parseInt(directMoney[1].replace(/,/g, ""), 10);
      budgetMinor = val * 100;
    }

    // Location / City
    let city: string | null = context.city || null;
    const cities = ["bangalore", "bengaluru", "mumbai", "delhi", "pune", "hyderabad", "chennai", "kolkata", "jaipur", "goa"];
    for (const c of cities) {
      if (lower.includes(c)) {
        city = c.charAt(0).toUpperCase() + c.slice(1);
        if (city === "Bangalore") city = "Bengaluru";
        break;
      }
    }

    // Month or relative date
    let date: string | null = context.date || null;
    const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    for (let i = 0; i < months.length; i++) {
      if (lower.includes(months[i])) {
        const year = 2027; // Future target
        const monthStr = String(i + 1).padStart(2, "0");
        date = `${year}-${monthStr}-15`;
        break;
      }
    }
    if (!date && lower.includes("next month")) {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      date = d.toISOString().split("T")[0];
    }

    // Confirmed & Missing
    const confirmed: string[] = [];
    const missing: string[] = [];
    const questions: string[] = [];

    if (eventType) confirmed.push("event_type"); else missing.push("event_type");
    if (guests) confirmed.push("guest_count"); else missing.push("guest_count");
    if (budgetMinor) confirmed.push("budget"); else missing.push("budget");
    if (city) confirmed.push("location"); else missing.push("location");
    if (date) confirmed.push("date"); else missing.push("date");

    if (!guests) questions.push("How many guests are you expecting to invite?");
    if (!budgetMinor) questions.push("What target budget do you have in mind (e.g., ₹15 Lakhs)?");
    if (!city) questions.push("Which city or venue destination are you planning for?");

    let name = context.name || null;
    if (!name && eventType) {
      const typeLabel = eventType.charAt(0) + eventType.slice(1).toLowerCase();
      name = city ? `${city} ${typeLabel} Celebration` : `Grand ${typeLabel}`;
    }

    return {
      event_type: eventType,
      name,
      date,
      date_precision: "EXACT",
      city: city || "Bengaluru",
      country_code: "IN",
      guest_count: guests,
      budget_minor: budgetMinor,
      currency: "INR",
      style: lower.includes("traditional") ? "Traditional Elegant" : "Modern Contemporary",
      duration_hours: eventType === "WEDDING" ? 8 : 4,
      food_preferences: lower.includes("veg") ? ["Vegetarian"] : ["Multi-Cuisine Buffet"],
      special_requirements: [],
      confirmed_fields: confirmed,
      missing_fields: missing,
      follow_up_questions: questions.slice(0, 3),
      contradictions: [],
    };
  }

  private static heuristicPlanGeneration(ctx: any): PlanGeneration {
    const type = ctx.event_type || "WEDDING";
    const ratios = BudgetService.getDefaultRatios(type).map((r) => ({
      category: r.category,
      percentage: r.percentage,
      reasoning: `Standard benchmark allocation of ${r.percentage}% for ${r.category} in a ${type.toLowerCase()}.`,
    }));

    const milestones = TimelineService.getDefaultMilestones(type, ctx.date).map((m) => ({
      title: m.title,
      offset_days: m.offsetDays,
    }));

    const tasks = [
      {
        title: "Shortlist & Tour Venue Options",
        description: "Compare banquet hall capacities, parking spaces, and catering rules.",
        relative_offset_days: -90,
        priority: "HIGH" as const,
        category: "venue",
      },
      {
        title: "Tasting Session with Catering Partners",
        description: "Finalize live counters, dessert menus, and vegetarian options.",
        relative_offset_days: -75,
        priority: "HIGH" as const,
        category: "catering",
      },
      {
        title: "Book Candid & Traditional Photographer",
        description: "Review portfolio of previous events, drone coverage, and album delivery terms.",
        relative_offset_days: -60,
        priority: "MEDIUM" as const,
        category: "photography",
      },
      {
        title: "Finalize Decor Theme & Floral Palette",
        description: "Stage backdrop, entrance arch, table centerpieces, and ambient lighting.",
        relative_offset_days: -45,
        priority: "MEDIUM" as const,
        category: "decoration",
      },
      {
        title: "Send Digital & Physical Invitations",
        description: "Distribute invites with Google Maps location pin and RSVP link.",
        relative_offset_days: -30,
        priority: "URGENT" as const,
        category: "invitations",
      },
      {
        title: "Final Guest Count & Seating Chart Confirmation",
        description: "Confirm guaranteed plate count with caterer to avoid wastage.",
        relative_offset_days: -7,
        priority: "URGENT" as const,
        category: "catering",
      },
    ];

    const vendors = [
      {
        category: "Venue",
        role: "Banquet Hall / Resort Partner",
        notes: "Require air-conditioned hall with dedicated bridal/guest dressing rooms.",
      },
      {
        category: "Catering",
        role: "Buffet & Live Food Counters",
        notes: "Ensure hygiene certification and separate pure-vegetarian preparation counter.",
      },
      {
        category: "Decoration",
        role: "Floral & Stage Designer",
        notes: "Theme: Pastel floral arches with warm ambient fairy lighting.",
      },
      {
        category: "Photography",
        role: "Lead Photographer & Videographer",
        notes: "Coverage of main ceremony, family portraits, and candid highlight teaser reel.",
      },
      {
        category: "Entertainment",
        role: "DJ / Live Acoustic Ensemble",
        notes: "Sound system with cordless microphones for speeches and background music.",
      },
    ];

    const ideas = [
      {
        kind: "experience" as const,
        title: "Personalized QR-Code Memory Wall",
        description: "A digital display where guests scan a QR code to upload photos live during the event.",
        cost_range: "₹5,000 - ₹12,000",
      },
      {
        kind: "catering" as const,
        title: "Signature Artisanal Mocktail Bar",
        description: "Curated welcome drinks featuring local flavors (Kokum Fizz, Tender Coconut Punch).",
        cost_range: "₹15,000 - ₹35,000",
      },
      {
        kind: "theme" as const,
        title: "Eco-Friendly Seed Paper Favors",
        description: "Custom engraved thank-you cards embedded with wildflower seeds for guests to plant at home.",
        cost_range: "₹8,000 - ₹20,000",
      },
      {
        kind: "logistics" as const,
        title: "Dedicated WhatsApp Concierge Bot",
        description: "An automated assistant sharing parking directions, schedule, and Wi-Fi codes with guests.",
        cost_range: "₹3,000 - ₹8,000",
      },
    ];

    return {
      summary: `Tailored plan for ${ctx.name || "Event"} in ${ctx.city} with ${ctx.guest_count || 100} guests.`,
      suggested_theme: `${ctx.style || "Modern Elegance"} with Vibrant Celebratory Accents`,
      budget_ratios: ratios,
      milestones,
      tasks,
      vendors,
      ideas,
    };
  }

  private static heuristicModification(message: string, state: any): ActionProposalOutput {
    const lower = message.toLowerCase();

    // Check for guest count adjustment
    const guestMatch = lower.match(/(?:increase|decrease|change|have|set)?\s*(?:guest\s*count\s*(?:to|by)?)?\s*(\d{2,4})\s*(?:guests?|people|pax)?/i);
    if (lower.includes("guest") && guestMatch) {
      const newGuests = parseInt(guestMatch[1], 10);
      const res = ModificationService.analyzeGuestCountChange(
        state.event,
        state.budget.categories,
        newGuests,
        !lower.includes("increase budget")
      );
      return res.proposal;
    }

    // Check for budget reduction (e.g., "reduce decoration by ₹20,000" or "reduce decoration by 20000")
    if (lower.includes("reduce") || lower.includes("decrease") || lower.includes("cut")) {
      let cat: any = "decoration";
      const categories = ["venue", "catering", "decoration", "photography", "entertainment", "transportation", "invitations"];
      for (const c of categories) {
        if (lower.includes(c)) {
          cat = c;
          break;
        }
      }

      let amountMinor = 2000000; // default 20,000 INR
      const lakhMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|l)/i);
      const directMatch = lower.match(/(?:₹|rs\.?|inr)?\s*([\d,]+)/i);

      if (lakhMatch) {
        amountMinor = Math.round(parseFloat(lakhMatch[1]) * 100000 * 100);
      } else if (directMatch) {
        amountMinor = parseInt(directMatch[1].replace(/,/g, ""), 10) * 100;
      }

      const currentCat = state.budget?.categories?.find((c: any) => c.category === cat);
      const currentMinor = currentCat ? currentCat.estimated_minor : amountMinor * 2;

      return ModificationService.analyzeBudgetReduction(cat, currentMinor, amountMinor, state.event.currency);
    }

    // Check for adding a task (e.g., "add a photographer task" or "add task book makeup artist")
    if (lower.includes("add task") || lower.includes("new task")) {
      const taskTitle = message.replace(/add task|new task/gi, "").trim() || "Review Additional Vendor";
      return {
        intent: "ADD_TASK",
        confidence: 0.9,
        requires_confirmation: false,
        message: `I've prepared a new task: "${taskTitle}".`,
        impact_summary: {
          budget_change_minor: 0,
          affected_categories: [],
          affected_milestones: ["Final Vendor Walkthrough"],
          warnings: [],
        },
        operations: [
          {
            op: "add_task",
            params: {
              title: taskTitle,
              description: "Added via conversational assistant.",
              priority: "MEDIUM",
              due_at: state.event.date || new Date().toISOString().split("T")[0],
            },
          },
        ],
      };
    }

    // Default conversational reply
    return {
      intent: "QUESTION",
      confidence: 0.85,
      requires_confirmation: false,
      message: `I understood your message: "${message}". I can adjust budget categories, modify guest counts, update timelines, or add specific vendors. Try asking: "Reduce decoration by ₹20,000" or "Change guest count to 300".`,
      impact_summary: {
        budget_change_minor: 0,
        affected_categories: [],
        affected_milestones: [],
        warnings: [],
      },
      operations: [],
    };
  }
}
