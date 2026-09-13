import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { json } from "@/lib/api";
import { listResponse } from "@/lib/serialize";
import {
  createInvoice,
  invoiceBodySchema,
  listInvoices,
  serializeInvoice,
} from "@/lib/invoices";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });

  const status = request.nextUrl.searchParams.get("status");
  const rows = await listInvoices(status);
  return json(listResponse(rows.map(serializeInvoice)));
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });

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

    const created = await createInvoice(parsed.data);
    return json({ data: serializeInvoice(created) }, { status: 201 });
  } catch (error) {
    return json(
      {
        error: "Création impossible",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 400 }
    );
  }
}
