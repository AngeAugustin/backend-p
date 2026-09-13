import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { json } from "@/lib/api";
import { finalizeInvoice, serializeInvoice } from "@/lib/invoices";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  try {
    const updated = await finalizeInvoice(id);
    if (!updated) return json({ error: "Not found" }, { status: 404 });
    return json({ data: serializeInvoice(updated) });
  } catch (error) {
    return json(
      {
        error: "Finalisation impossible",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 400 }
    );
  }
}
