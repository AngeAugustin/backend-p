import { requireAdmin } from "@/lib/auth";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { listResponse } from "@/lib/serialize";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.articleComment.findMany({
    orderBy: { createdAt: "desc" },
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

  return json(
    listResponse(
      rows.map((row) => ({
        id: row.id,
        authorName: row.authorName,
        authorEmail: row.authorEmail,
        body: row.body,
        status: row.status,
        articleId: row.articleId,
        article: row.article,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }))
    )
  );
}
