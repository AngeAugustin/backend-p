import { z } from "zod";
import type { Prisma, ProformaInvoice, ProformaInvoiceItem } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { defaultIssuer } from "@/lib/invoice-issuer";
import {
  asNumber,
  computeTotals,
  INVOICE_STATUSES,
  isInvoiceFinalized,
  lineAmount,
  normalizeInvoiceStatus,
  parseDateOnly,
  type InvoiceStatus,
  type SerializedInvoice,
} from "@/lib/invoice-shared";

export {
  asNumber,
  computeTotals,
  formatDate,
  formatMoney,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUSES,
  INVOICE_UNITS,
  invoicePdfFilename,
  isInvoiceFinalized,
  lineAmount,
  normalizeInvoiceStatus,
  parseDateOnly,
  roundMoney,
  toDateInput,
  type InvoiceStatus,
  type SerializedInvoice,
  type SerializedInvoiceItem,
} from "@/lib/invoice-shared";

const optionalString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null) return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  });

const invoiceItemSchema = z.object({
  description: z.string().trim().min(1, "Description requise"),
  unitPrice: z.coerce.number().min(0, "Prix invalide"),
  quantity: z.coerce.number().optional(),
  unit: z.string().optional(),
});

export const invoiceBodySchema = z.object({
  status: z.enum(INVOICE_STATUSES).optional(),
  issuedAt: z.string().min(1, "Date d’émission requise"),
  validUntil: optionalString,
  clientName: z.string().trim().min(1, "Nom du client requis"),
  clientEmail: optionalString,
  clientCompany: optionalString,
  clientPhone: optionalString,
  clientAddress: optionalString,
  clientCity: optionalString,
  clientCountry: optionalString,
  clientIfu: optionalString,
  issuerName: z.string().trim().min(1).optional(),
  issuerTitle: optionalString,
  issuerEmail: z.string().trim().email().optional(),
  issuerPhone: optionalString,
  issuerAddress: optionalString,
  issuerCity: optionalString,
  issuerCountry: optionalString,
  issuerIfu: optionalString,
  issuerWebsite: optionalString,
  currency: z.enum(["XOF", "EUR"]).optional(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  notes: optionalString,
  items: z.array(invoiceItemSchema).min(1, "Ajoutez au moins une ligne"),
});

export type InvoiceBody = z.infer<typeof invoiceBodySchema>;

export type InvoiceWithItems = ProformaInvoice & {
  items: ProformaInvoiceItem[];
};

export async function nextInvoiceNumber(
  client: Prisma.TransactionClient | typeof prisma = prisma
) {
  const year = new Date().getFullYear();
  const prefix = `PF-${year}-`;
  const last = await client.proformaInvoice.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const lastSeq = last ? Number(last.number.slice(prefix.length)) : 0;
  const seq = Number.isFinite(lastSeq) ? lastSeq + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export function serializeInvoice(invoice: InvoiceWithItems): SerializedInvoice {
  const items = [...invoice.items]
    .sort((a, b) => a.order - b.order)
    .map((item, index) => {
      const quantity = asNumber(item.quantity);
      const unitPrice = asNumber(item.unitPrice);
      return {
        id: item.id,
        description: item.description,
        quantity,
        unit: item.unit,
        unitPrice,
        amount: lineAmount(quantity, unitPrice),
        order: item.order ?? index,
      };
    });
  const taxRate = asNumber(invoice.taxRate);
  const totals = computeTotals(items, taxRate);

  return {
    id: invoice.id,
    number: invoice.number,
    status: normalizeInvoiceStatus(invoice.status),
    issuedAt: invoice.issuedAt.toISOString(),
    validUntil: invoice.validUntil?.toISOString() ?? null,
    clientName: invoice.clientName,
    clientEmail: invoice.clientEmail,
    clientCompany: invoice.clientCompany,
    clientPhone: invoice.clientPhone,
    clientAddress: invoice.clientAddress,
    clientCity: invoice.clientCity,
    clientCountry: invoice.clientCountry,
    clientIfu: invoice.clientIfu,
    issuerName: invoice.issuerName,
    issuerTitle: invoice.issuerTitle,
    issuerEmail: invoice.issuerEmail,
    issuerPhone: invoice.issuerPhone,
    issuerAddress: invoice.issuerAddress,
    issuerCity: invoice.issuerCity,
    issuerCountry: invoice.issuerCountry,
    issuerIfu: invoice.issuerIfu,
    issuerWebsite: invoice.issuerWebsite,
    currency: invoice.currency,
    taxRate,
    notes: invoice.notes,
    items,
    ...totals,
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
  };
}

export function invoiceWriteData(body: InvoiceBody) {
  const issuerName = body.issuerName?.trim() || defaultIssuer.name;
  const issuerEmail = body.issuerEmail?.trim() || defaultIssuer.email;
  const issuedAt = parseDateOnly(body.issuedAt) ?? new Date();
  const validUntil = parseDateOnly(body.validUntil ?? undefined);

  return {
    status: "draft",
    issuedAt,
    validUntil,
    clientName: body.clientName.trim(),
    clientEmail: body.clientEmail,
    clientCompany: body.clientCompany,
    clientPhone: body.clientPhone,
    clientAddress: body.clientAddress,
    clientCity: body.clientCity,
    clientCountry: body.clientCountry,
    clientIfu: body.clientIfu,
    issuerName,
    issuerTitle: body.issuerTitle ?? defaultIssuer.title,
    issuerEmail,
    issuerPhone: body.issuerPhone ?? defaultIssuer.phone,
    issuerAddress: body.issuerAddress ?? (defaultIssuer.address || null),
    issuerCity: body.issuerCity ?? defaultIssuer.city,
    issuerCountry: body.issuerCountry ?? defaultIssuer.country,
    issuerIfu: body.issuerIfu,
    issuerWebsite: body.issuerWebsite ?? defaultIssuer.website,
    currency: body.currency || "XOF",
    taxRate: body.taxRate ?? 0,
    notes: body.notes,
    items: {
      create: body.items.map((item, index) => ({
        description: item.description.trim(),
        quantity: 1,
        unit: "u",
        unitPrice: item.unitPrice,
        order: index,
      })),
    },
  } satisfies Omit<Prisma.ProformaInvoiceCreateInput, "number">;
}

export async function createInvoice(body: InvoiceBody) {
  return prisma.$transaction(async (tx) => {
    const number = await nextInvoiceNumber(tx);
    return tx.proformaInvoice.create({
      data: {
        number,
        ...invoiceWriteData(body),
      },
      include: { items: { orderBy: { order: "asc" } } },
    });
  });
}

export async function updateInvoice(id: string, body: InvoiceBody) {
  const existing = await prisma.proformaInvoice.findUnique({ where: { id } });
  if (!existing) throw new Error("Not found");
  if (isInvoiceFinalized(existing.status)) {
    throw new Error(
      "Cette proforma est finalisée et ne peut plus être modifiée."
    );
  }

  const data = invoiceWriteData(body);
  return prisma.$transaction(async (tx) => {
    await tx.proformaInvoiceItem.deleteMany({ where: { invoiceId: id } });
    return tx.proformaInvoice.update({
      where: { id },
      data: {
        status: "draft",
        issuedAt: data.issuedAt,
        validUntil: data.validUntil,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientCompany: data.clientCompany,
        clientPhone: data.clientPhone,
        clientAddress: data.clientAddress,
        clientCity: data.clientCity,
        clientCountry: data.clientCountry,
        clientIfu: data.clientIfu,
        issuerName: data.issuerName,
        issuerTitle: data.issuerTitle,
        issuerEmail: data.issuerEmail,
        issuerPhone: data.issuerPhone,
        issuerAddress: data.issuerAddress,
        issuerCity: data.issuerCity,
        issuerCountry: data.issuerCountry,
        issuerIfu: data.issuerIfu,
        issuerWebsite: data.issuerWebsite,
        currency: data.currency,
        taxRate: data.taxRate,
        notes: data.notes,
        items: data.items,
      },
      include: { items: { orderBy: { order: "asc" } } },
    });
  });
}

export async function finalizeInvoice(id: string) {
  const existing = await getInvoice(id);
  if (!existing) return null;
  if (isInvoiceFinalized(existing.status)) return existing;

  return prisma.proformaInvoice.update({
    where: { id },
    data: { status: "finalized" },
    include: { items: { orderBy: { order: "asc" } } },
  });
}

export async function getInvoice(id: string) {
  return prisma.proformaInvoice.findUnique({
    where: { id },
    include: { items: { orderBy: { order: "asc" } } },
  });
}

export async function listInvoices(status?: string | null) {
  const normalized =
    status && INVOICE_STATUSES.includes(status as InvoiceStatus)
      ? (status as InvoiceStatus)
      : null;

  const where = !normalized
    ? undefined
    : normalized === "finalized"
      ? { status: { in: ["finalized", "sent", "accepted"] } }
      : { status: { in: ["draft", "cancelled"] } };

  return prisma.proformaInvoice.findMany({
    where,
    include: { items: { orderBy: { order: "asc" } } },
    orderBy: [{ issuedAt: "desc" }, { createdAt: "desc" }],
  });
}
