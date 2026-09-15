import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { json, options } from "@/lib/api";
import {
  findPublishedArticle,
  resolveVisitorHash,
  serializeComment,
} from "@/lib/article-engagement";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const querySchema = z.object({
  slug: z.string().trim().min(1),
  locale: z.string().trim().min(2).max(8).optional(),
});

const createSchema = z.object({
  data: z.object({
    slug: z.string().trim().min(1),
    locale: z.string().trim().min(2).max(8).optional(),
    authorName: z.string().trim().min(1).max(80),
    authorEmail: z.string().trim().max(160).optional(),
    body: z.string().trim().min(2).max(2000),
    visitorKey: z.string().trim().min(8).max(64).optional(),
  }),
});

export async function OPTIONS(request: Request) {
  return options(request.headers.get("origin"));
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const { searchParams } = new URL(request.url);

  try {
    const parsed = querySchema.safeParse({
      slug: searchParams.get("slug") || "",
      locale: searchParams.get("locale") || undefined,
    });

    if (!parsed.success) {
      return json(
        { error: "Invalid query", details: parsed.error.flatten() },
        { status: 400, origin }
      );
    }

    const slug = parsed.data.slug;
    const locale = parsed.data.locale || "fr";
    const article = await findPublishedArticle(slug, locale);

    if (!article) {
      return json({ error: "Article not found" }, { status: 404, origin });
    }

    const comments = await prisma.articleComment.findMany({
      where: {
        articleId: article.id,
        status: "approved",
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        authorName: true,
        body: true,
        createdAt: true,
      },
    });

    return json(
      {
        data: comments.map(serializeComment),
        meta: { total: comments.length },
      },
      { origin }
    );
  } catch {
    return json({ error: "Unable to load comments" }, { status: 500, origin });
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  try {
    const rateLimit = checkRateLimit(`article-comment:${getClientIp(request)}`);
    if (!rateLimit.allowed) {
      return json({ error: "Too many requests" }, { status: 429, origin });
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400, origin }
      );
    }

    const {
      slug,
      locale: rawLocale,
      authorName,
      authorEmail,
      body: commentBody,
      visitorKey,
    } = parsed.data.data;

    const emailRaw = authorEmail?.trim() || "";
    if (emailRaw) {
      const emailCheck = z.string().email().safeParse(emailRaw);
      if (!emailCheck.success) {
        return json(
          { error: "Invalid email" },
          { status: 400, origin }
        );
      }
    }

    const locale = rawLocale || "fr";
    const article = await findPublishedArticle(slug, locale);

    if (!article) {
      return json({ error: "Article not found" }, { status: 404, origin });
    }

    const visitorHash = resolveVisitorHash(request, visitorKey);
    const email = emailRaw || null;

    const created = await prisma.articleComment.create({
      data: {
        articleId: article.id,
        authorName: authorName.trim(),
        authorEmail: email,
        body: commentBody.trim(),
        status: "pending",
        visitorHash,
      },
      select: {
        id: true,
        authorName: true,
        body: true,
        status: true,
        createdAt: true,
      },
    });

    return json(
      {
        data: serializeComment(created),
      },
      { status: 201, origin }
    );
  } catch {
    return json({ error: "Unable to create comment" }, { status: 500, origin });
  }
}
