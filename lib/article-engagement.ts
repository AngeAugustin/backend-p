import { createHash } from "crypto";
import { hashVisitor } from "@/lib/article-views";
import { prisma } from "@/lib/prisma";

const VISITOR_KEY_RE = /^[a-zA-Z0-9_-]{8,64}$/;

export function resolveVisitorHash(request: Request, visitorKey?: string | null) {
  const key = visitorKey?.trim();
  if (key && VISITOR_KEY_RE.test(key)) {
    const salt =
      process.env.AUTH_SECRET || process.env.VIEW_SALT || "portfolio-views";
    return createHash("sha256")
      .update(`key:${key}:${salt}`)
      .digest("hex")
      .slice(0, 32);
  }
  return hashVisitor(request);
}

export async function findPublishedArticle(slug: string, locale: string) {
  return prisma.article.findFirst({
    where: {
      slug,
      locale,
      publishedAt: { not: null },
    },
    select: { id: true, slug: true, locale: true, title: true },
  });
}

export function serializeComment(comment: {
  id: string;
  authorName: string;
  body: string;
  createdAt: Date;
  status?: string;
  authorEmail?: string | null;
  articleId?: string;
}) {
  return {
    id: comment.id,
    authorName: comment.authorName,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    ...(comment.status !== undefined ? { status: comment.status } : {}),
    ...(comment.authorEmail !== undefined
      ? { authorEmail: comment.authorEmail }
      : {}),
    ...(comment.articleId !== undefined ? { articleId: comment.articleId } : {}),
  };
}
