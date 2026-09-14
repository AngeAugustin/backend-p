import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { aggregateArticleViews } from "@/lib/article-views";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;

  const article = await prisma.article.findUnique({
    where: { id },
    select: { id: true, title: true, slug: true, locale: true },
  });

  if (!article) {
    return json({ error: "Not found" }, { status: 404 });
  }

  const views = await prisma.articleView.findMany({
    where: { articleId: id },
    select: {
      id: true,
      visitorHash: true,
      country: true,
      countryCode: true,
      city: true,
      region: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return json({
    data: {
      article,
      ...aggregateArticleViews(views),
    },
  });
}
