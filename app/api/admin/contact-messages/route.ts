import { requireAdmin } from "@/lib/auth";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { listResponse } from "@/lib/serialize";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });

  return json(
    listResponse(
      rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }))
    )
  );
}
