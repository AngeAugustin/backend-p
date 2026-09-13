import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import {
  getInvoice,
  invoiceBodySchema,
  isInvoiceFinalized,
  serializeInvoice,
  updateInvoice,
} from "@/lib/invoices";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const row = await getInvoice(id);
  if (!row) return json({ error: "Not found" }, { status: 404 });
  return json({ data: serializeInvoice(row) });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const existing = await getInvoice(id);
  if (!existing) return json({ error: "Not found" }, { status: 404 });
  if (isInvoiceFinalized(existing.status)) {
    return json(
      {
        error: "Cette proforma est finalisée et ne peut plus être modifiée.",
      },
      { status: 409 }
    );
  }

  try {
    const parsed = invoiceBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return json(
        {
          error: "Données invalides",
          details: parsed.error.issues.map((issue) => issue.message).join(" · "),
        },
        { status: 400 }
      );
    }

    const updated = await updateInvoice(id, parsed.data);
    return json({ data: serializeInvoice(updated) });
  } catch (error) {
    return json(
      {
        error: "Mise à jour impossible",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  try {
    await prisma.proformaInvoice.delete({ where: { id } });
    return json({ ok: true });
  } catch {
    return json({ error: "Suppression impossible" }, { status: 400 });
  }
}
