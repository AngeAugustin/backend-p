export const INVOICE_STATUSES = ["draft", "finalized"] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Brouillon",
  finalized: "Finalisé",
};

const LEGACY_FINALIZED = new Set(["finalized", "sent", "accepted"]);

export function normalizeInvoiceStatus(status: string): InvoiceStatus {
  return LEGACY_FINALIZED.has(status) ? "finalized" : "draft";
}

export function isInvoiceFinalized(status: string) {
  return normalizeInvoiceStatus(status) === "finalized";
}

export const INVOICE_UNITS = [
  { value: "u", label: "unité" },
  { value: "forfait", label: "forfait" },
  { value: "jour", label: "jour" },
  { value: "heure", label: "heure" },
  { value: "mois", label: "mois" },
] as const;

export const INVOICE_VALIDITY_DAYS = 90;

export type SerializedInvoiceItem = {
  id?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  order: number;
};

export type SerializedInvoice = {
  id: string;
  number: string;
  status: InvoiceStatus;
  issuedAt: string;
  validUntil: string | null;
  clientName: string;
  clientEmail: string | null;
  clientCompany: string | null;
  clientPhone: string | null;
  clientAddress: string | null;
  clientCity: string | null;
  clientCountry: string | null;
  clientIfu: string | null;
  issuerName: string;
  issuerTitle: string | null;
  issuerEmail: string;
  issuerPhone: string | null;
  issuerAddress: string | null;
  issuerCity: string | null;
  issuerCountry: string | null;
  issuerIfu: string | null;
  issuerWebsite: string | null;
  currency: string;
  taxRate: number;
  notes: string | null;
  items: SerializedInvoiceItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
};

export function asNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (
    typeof value === "object" &&
    "toNumber" in value &&
    typeof (value as { toNumber: () => number }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function lineAmount(quantity: number, unitPrice: number) {
  return roundMoney(quantity * unitPrice);
}

export function computeTotals(
  items: { quantity: number; unitPrice: number }[],
  taxRate: number
) {
  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + lineAmount(item.quantity, item.unitPrice), 0)
  );
  const taxAmount = roundMoney(subtotal * (taxRate / 100));
  return {
    subtotal,
    taxAmount,
    total: roundMoney(subtotal + taxAmount),
  };
}

function formatNumberFr(amount: number, fractionDigits: number) {
  const [integer, fraction] = roundMoney(amount)
    .toFixed(fractionDigits)
    .split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return fractionDigits > 0 ? `${grouped},${fraction}` : grouped;
}

export function formatMoney(amount: number, currency: string) {
  const zeroDecimal = currency === "XOF" || currency === "XAF";
  const formatted = formatNumberFr(amount, zeroDecimal ? 0 : 2);
  if (currency === "EUR") return `${formatted} EUR`;
  return `${formatted} F CFA`;
}

export function pdfSafeText(value: string) {
  return value
    .replace(/[\u202F\u00A0\u2007\u2008\u2009\u200A\u2060\uFEFF]/g, " ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function toDateInput(value: string | Date | null | undefined) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function defaultValidUntilInput(from: Date = new Date()) {
  const date = new Date(from);
  date.setDate(date.getDate() + INVOICE_VALIDITY_DAYS);
  return toDateInput(date);
}

export function parseDateOnly(value: string | null | undefined) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function invoicePdfFilename(number: string) {
  return `PROFORMA-${number.replace(/[^\w.-]+/g, "-")}.pdf`;
}
