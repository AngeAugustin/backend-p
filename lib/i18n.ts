import type { Locale, SuggestedQuestion } from "./types";

export const locales: Locale[] = ["fr", "en"];

export const ui = {
  fr: {
    pageTitle: "Augustin FACHEHOUN",
    pageSubtitle: "Développeur FullStack & IA",
    pageDescription:
      "Portfolio interactif avec assistant IA. Posez des questions sur mon parcours, mes projets et mes compétences.",
    openChat: "Ouvrir le chat",
    closeChat: "Fermer le chat",
    chatTitle: "Kadoukpè",
    chatSubtitle: "Propulsé par RAG · streaming",
    assistantRole: "Assistant IA",
    justNow: "À l'instant",
    welcome:
      "👋 Bonjour ! Je suis Kadoukpè, l'assistant d'Augustin. Posez-moi toutes vos questions.",
    placeholder: "Écrivez votre message…",
    send: "Envoyer",
    typing: "Réflexion en cours…",
    disclaimer:
      "Réponses générées par IA (RAG) à partir du profil public. Les messages sont traités par Google Gemini.",
    suggestionsLabel: "Suggestions",
    language: "Langue",
    howItWorksLink: "Comment ça marche ?",
    errorGeneric:
      "Désolé, une erreur s'est produite. Réessayez dans un instant ou contactez Augustin à hello@augustinfachehoun.dev.",
    errorRateLimit:
      "Trop de messages envoyés. Patientez quelques minutes avant de réessayer.",
    errorGeminiUnavailable:
      "L'assistant est temporairement indisponible. Réessayez un peu plus tard.",
    errorNotConfigured:
      "Le service IA n'est pas encore configuré. Ajoutez GEMINI_API_KEYS dans .env.local.",
  },
  en: {
    pageTitle: "Augustin FACHEHOUN",
    pageSubtitle: "FullStack & AI Developer",
    pageDescription:
      "Interactive portfolio with an AI assistant. Ask about my background, projects, and skills.",
    openChat: "Open chat",
    closeChat: "Close chat",
    chatTitle: "Kadoukpè",
    chatSubtitle: "Powered by RAG · streaming",
    assistantRole: "AI Assistant",
    justNow: "Just now",
    welcome:
      "👋 Hello! I'm Kadoukpè, Augustin's assistant. Ask me anything.",
    placeholder: "Type your message…",
    send: "Send",
    typing: "Thinking…",
    disclaimer:
      "AI-generated answers (RAG) based on the public profile. Messages are processed by Google Gemini.",
    suggestionsLabel: "Suggestions",
    language: "Language",
    howItWorksLink: "How it works",
    errorGeneric:
      "Sorry, something went wrong. Try again in a moment or reach Augustin at hello@augustinfachehoun.dev.",
    errorRateLimit:
      "Too many messages sent. Please wait a few minutes before trying again.",
    errorGeminiUnavailable:
      "The assistant is temporarily unavailable. Please try again later.",
    errorNotConfigured:
      "The AI service is not configured yet. Add GEMINI_API_KEYS to .env.local.",
  },
} as const satisfies Record<Locale, Record<string, string>>;

export const suggestedQuestions: SuggestedQuestion[] = [
  {
    id: "projects",
    label: {
      fr: "Quels projets as-tu réalisés ?",
      en: "What projects have you built?",
    },
  },
  {
    id: "skills",
    label: {
      fr: "Quelle est ta stack ?",
      en: "What's your tech stack?",
    },
  },
  {
    id: "contact",
    label: {
      fr: "Comment te contacter ?",
      en: "How can I reach you?",
    },
  },
];

export function getUi(locale: Locale) {
  return ui[locale];
}
