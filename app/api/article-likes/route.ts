import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { json, options } from "@/lib/api";
import {
  findPublishedArticle,
  resolveVisitorHash,
} from "@/lib/article-engagement";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const querySchema = z.object({
  slug: z.string().trim().min(1),
  locale: z.string().trim().min(2).max(8).optional(),
  visitorKey: z.string().trim().min(8).max(64).optional(),
});

const toggleSchema = z.object({
  data: z.object({
    slug: z.string().trim().min(1),
    locale: z.string().trim().min(2).max(8).optional(),
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
      visitorKey: searchParams.get("visitorKey") || undefined,
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

    const visitorHash = resolveVisitorHash(request, parsed.data.visitorKey);

    const [likeCount, existing] = await Promise.all([
      prisma.articleLike.count({ where: { articleId: article.id } }),
      prisma.articleLike.findUnique({
        where: {
          articleId_visitorHash: {
            articleId: article.id,
            visitorHash,
          },
        },
        select: { id: true },
      }),
    ]);

    return json(
      {
        data: {
          likeCount,
          liked: Boolean(existing),
        },
      },
      { origin }
    );
  } catch {
    return json({ error: "Unable to load likes" }, { status: 500, origin });
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  try {
    const rateLimit = checkRateLimit(`article-like:${getClientIp(request)}`);
    if (!rateLimit.allowed) {
      return json({ error: "Too many requests" }, { status: 429, origin });
    }

    const body = await request.json();
    const parsed = toggleSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400, origin }
      );
    }

    const slug = parsed.data.data.slug;
    const locale = parsed.data.data.locale || "fr";
    const article = await findPublishedArticle(slug, locale);

    if (!article) {
      return json({ error: "Article not found" }, { status: 404, origin });
    }

    const visitorHash = resolveVisitorHash(
      request,
      parsed.data.data.visitorKey
    );

    const existing = await prisma.articleLike.findUnique({
      where: {
        articleId_visitorHash: {
          articleId: article.id,
          visitorHash,
        },
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.articleLike.delete({ where: { id: existing.id } });
    } else {
      await prisma.articleLike.create({
        data: { articleId: article.id, visitorHash },
      });
    }

    const likeCount = await prisma.articleLike.count({
      where: { articleId: article.id },
    });

    return json(
      {
        data: {
          likeCount,
          liked: !existing,
        },
      },
      { origin }
    );
  } catch {
    return json({ error: "Unable to toggle like" }, { status: 500, origin });
  }
}
