export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export type LocalizedPair = { fr: string; en: string };

export function isBilingualCreatePayload(
  body: unknown
): body is Record<string, unknown> & {
  bilingual: true;
  locales: { fr: Record<string, unknown>; en: Record<string, unknown> };
} {
  if (!body || typeof body !== "object") return false;
  const record = body as Record<string, unknown>;
  if (record.bilingual !== true) return false;
  const locales = record.locales;
  if (!locales || typeof locales !== "object") return false;
  const pair = locales as Record<string, unknown>;
  return (
    Boolean(pair.fr) &&
    typeof pair.fr === "object" &&
    Boolean(pair.en) &&
    typeof pair.en === "object"
  );
}

export function localizedText(
  locales: { fr: Record<string, unknown>; en: Record<string, unknown> },
  field: string,
  locale: "fr" | "en"
) {
  const value = locales[locale][field];
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}
