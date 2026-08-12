import type { Locale } from "@/lib/types";

const salaryPattern =
  /(\d[\d\s.,]*\s*(€|\$|USD|EUR|FCFA|XOF|k€)|salaire\s*(de|à|:)?\s*\d|rémunération\s*(de|à|:)?\s*\d|(\d+\s*)?(euros?|dollars?)\s*(par\s*(an|mois|year|month)))/i;

const refusal = {
  fr: "Je ne peux pas partager d'informations sur la rémunération. Pour discuter d'une opportunité professionnelle, contactez Augustin à hello@augustinfachehoun.dev.",
  en: "I can't share compensation details. For professional opportunities, please contact Augustin at hello@augustinfachehoun.dev.",
} as const;

export function sanitizeAssistantReply(content: string, locale: Locale): string {
  const trimmed = content.trim();
  if (!trimmed) return trimmed;

  if (salaryPattern.test(trimmed)) {
    return refusal[locale];
  }

  return trimmed;
}

export function isSalaryQuestion(message: string): boolean {
  return /salaire|salary|rémunération|rémuneration|compensation|pay|paie|tarif|salaire\s*brut/i.test(
    message,
  );
}

export function getSalaryRefusal(locale: Locale): string {
  return refusal[locale];
}
