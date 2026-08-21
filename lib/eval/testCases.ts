import type { Locale } from "@/lib/types";

export type TestCategory =
  | "projects"
  | "skills"
  | "contact"
  | "about"
  | "guardrail"
  | "unknown";

export interface EvalTestCase {
  id: string;
  locale: Locale;
  question: string;
  category: TestCategory;
  /** Partial path fragments expected in retrieved chunk sources (retrieval tests) */
  expectedSourceFragments?: string[];
  /** Minimum top similarity score expected (retrieval tests) */
  minTopSimilarity?: number;
  /** Should trigger salary guardrail (no LLM call) */
  expectRefusal?: boolean;
  notes: string;
}

export const evalTestCases: EvalTestCase[] = [
  {
    id: "fr-projects-react",
    locale: "fr",
    question: "Quels projets React as-tu réalisés ?",
    category: "projects",
    expectedSourceFragments: ["projects/"],
    minTopSimilarity: 0.35,
    notes: "Doit citer des projets documentés, pas inventer.",
  },
  {
    id: "fr-skills",
    locale: "fr",
    question: "Quelle est ta stack technique ?",
    category: "skills",
    expectedSourceFragments: ["skills.md"],
    minTopSimilarity: 0.4,
    notes: "Stack depuis skills.md.",
  },
  {
    id: "fr-contact",
    locale: "fr",
    question: "Comment te contacter ?",
    category: "contact",
    expectedSourceFragments: ["about.md"],
    minTopSimilarity: 0.35,
    notes: "Email me@augustinfachehoun.pro ou LinkedIn.",
  },
  {
    id: "fr-salary",
    locale: "fr",
    question: "Quel est ton salaire ?",
    category: "guardrail",
    expectRefusal: true,
    notes: "Refus poli, pas de chiffre.",
  },
  {
    id: "fr-grc",
    locale: "fr",
    question: "Parle-moi du projet GRC SaaS",
    category: "projects",
    expectedSourceFragments: ["grc-saas"],
    minTopSimilarity: 0.4,
    notes: "Projet GRC documenté.",
  },
  {
    id: "fr-unknown",
    locale: "fr",
    question: "As-tu travaillé chez la NASA ?",
    category: "unknown",
    notes: "Doit dire ne pas savoir / pas dans le contexte.",
  },
  {
    id: "fr-ai-projects",
    locale: "fr",
    question: "Quels projets IA as-tu réalisés ?",
    category: "projects",
    expectedSourceFragments: ["projects/"],
    minTopSimilarity: 0.35,
    notes: "accounting-ai, connectors-audit-ai, etc.",
  },
  {
    id: "fr-location",
    locale: "fr",
    question: "Où es-tu basé ?",
    category: "about",
    expectedSourceFragments: ["about.md"],
    minTopSimilarity: 0.35,
    notes: "Cotonou, Bénin.",
  },
  {
    id: "en-projects-react",
    locale: "en",
    question: "What React projects have you built?",
    category: "projects",
    expectedSourceFragments: ["projects/"],
    minTopSimilarity: 0.35,
    notes: "Documented projects only.",
  },
  {
    id: "en-skills",
    locale: "en",
    question: "What's your tech stack?",
    category: "skills",
    expectedSourceFragments: ["skills.md"],
    minTopSimilarity: 0.4,
    notes: "From skills.md.",
  },
  {
    id: "en-contact",
    locale: "en",
    question: "How can I reach you?",
    category: "contact",
    expectedSourceFragments: ["about.md"],
    minTopSimilarity: 0.35,
    notes: "Email or LinkedIn.",
  },
  {
    id: "en-salary",
    locale: "en",
    question: "What's your salary?",
    category: "guardrail",
    expectRefusal: true,
    notes: "Polite refusal.",
  },
  {
    id: "en-grc",
    locale: "en",
    question: "Tell me about the GRC SaaS project",
    category: "projects",
    expectedSourceFragments: ["grc-saas"],
    minTopSimilarity: 0.4,
    notes: "GRC project documented.",
  },
  {
    id: "en-unknown",
    locale: "en",
    question: "Did you work at NASA?",
    category: "unknown",
    notes: "Should say not in context.",
  },
  {
    id: "en-ai-projects",
    locale: "en",
    question: "What AI projects have you done?",
    category: "projects",
    expectedSourceFragments: ["projects/"],
    minTopSimilarity: 0.35,
    notes: "AI-related projects.",
  },
  {
    id: "en-location",
    locale: "en",
    question: "Where are you based?",
    category: "about",
    expectedSourceFragments: ["about.md"],
    minTopSimilarity: 0.35,
    notes: "Cotonou, Benin.",
  },
];
