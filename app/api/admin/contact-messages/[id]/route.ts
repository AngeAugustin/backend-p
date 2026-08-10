import { requireAdmin } from "@/lib/auth";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = (await request.json()) as { status?: string };

  try {
    const updated = await prisma.contactMessage.update({
      where: { id },
      data: {
        ...(body.status !== undefined ? { status: body.status } : {}),
      },
    });
    return json({
      data: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch {
    return json({ error: "Update failed" }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  try {
    await prisma.contactMessage.delete({ where: { id } });
    return json({ ok: true });
  } catch {
    return json({ error: "Delete failed" }, { status: 400 });
  }
}
