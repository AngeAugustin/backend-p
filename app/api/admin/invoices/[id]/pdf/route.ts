import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { json } from "@/lib/api";
import {
  getInvoice,
  invoicePdfFilename,
  serializeInvoice,
} from "@/lib/invoices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const row = await getInvoice(id);
  if (!row) return json({ error: "Not found" }, { status: 404 });

  const invoice = serializeInvoice(row);
  const [{ renderToBuffer }, { InvoicePdfDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/lib/invoice-pdf"),
  ]);

  const buffer = await renderToBuffer(
    InvoicePdfDocument({ invoice })
  );
  const filename = invoicePdfFilename(invoice.number);
  const bytes = new Uint8Array(buffer);

  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
