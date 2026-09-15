import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.articleComment.update({
      where: { id },
      data: { status: parsed.data.status },
      include: {
        article: {
          select: {
            id: true,
            title: true,
            slug: true,
            locale: true,
          },
        },
      },
    });

    return json({
      data: {
        id: updated.id,
        authorName: updated.authorName,
        authorEmail: updated.authorEmail,
        body: updated.body,
        status: updated.status,
        articleId: updated.articleId,
        article: updated.article,
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
    await prisma.articleComment.delete({ where: { id } });
    return json({ ok: true });
  } catch {
    return json({ error: "Delete failed" }, { status: 400 });
  }
}
