import { prisma } from "@/lib/prisma";
import {
  createAdminCollectionHandlers,
  parsePublishedAt,
} from "@/lib/admin-crud";
import {
  isBilingualCreatePayload,
  localizedText,
  slugify,
} from "@/lib/bilingual";

type Body = {
  bilingual?: boolean;
  locale?: string;
  slug?: string;
  title?: string;
  excerpt?: string;
  content?: string | null;
  category?: string;
  featured?: boolean;
  readMinutes?: number;
  date?: string;
  imageUrl?: string | null;
  publishedAt?: string | null;
  publish?: boolean;
  locales?: {
    fr: Record<string, unknown>;
    en: Record<string, unknown>;
  };
};

function sharedFromBody(data: Body) {
  return {
    category: data.category || "frontend",
    featured: Boolean(data.featured),
    readMinutes: data.readMinutes ?? 5,
    date:
      data.date ||
      `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
    imageUrl: data.imageUrl ?? null,
    publishedAt: parsePublishedAt(data.publishedAt, data.publish) ?? new Date(),
  };
}

const handlers = createAdminCollectionHandlers<Body>({
  list: async (locale) => {
    const rows = await prisma.article.findMany({
      where: locale ? { locale } : undefined,
      orderBy: [{ date: "desc" }, { updatedAt: "desc" }],
      include: { _count: { select: { views: true } } },
    });

    return rows.map(({ _count, ...row }) => ({
      ...row,
      viewCount: _count.views,
    }));
  },
  create: async (data) => {
    if (isBilingualCreatePayload(data)) {
      const locales = data.locales;
      const titleFr = localizedText(locales, "title", "fr").trim();
      const titleEn = localizedText(locales, "title", "en").trim();
      if (!titleFr || !titleEn) {
        throw new Error("Les titres FR et EN sont requis");
      }

      const slug =
        (typeof data.slug === "string" && data.slug.trim()) ||
        slugify(titleFr);
      if (!slug) throw new Error("Slug invalide");

      const shared = sharedFromBody(data);

      return prisma.$transaction([
        prisma.article.create({
          data: {
            locale: "fr",
            slug,
            title: titleFr,
            excerpt: localizedText(locales, "excerpt", "fr"),
            content: localizedText(locales, "content", "fr") || null,
            ...shared,
          },
        }),
        prisma.article.create({
          data: {
            locale: "en",
            slug,
            title: titleEn,
            excerpt: localizedText(locales, "excerpt", "en"),
            content: localizedText(locales, "content", "en") || null,
            ...shared,
          },
        }),
      ]);
    }

    if (!data.slug?.trim() || !data.title?.trim() || !data.excerpt?.trim()) {
      throw new Error("slug, title et excerpt sont requis");
    }

    return prisma.article.create({
      data: {
        locale: data.locale || "fr",
        slug: data.slug.trim(),
        title: data.title.trim(),
        excerpt: data.excerpt,
        content: data.content ?? null,
        category: data.category || "frontend",
        featured: Boolean(data.featured),
        readMinutes: data.readMinutes ?? 5,
        date:
          data.date ||
          `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
        imageUrl: data.imageUrl ?? null,
        publishedAt:
          parsePublishedAt(data.publishedAt, data.publish) ?? new Date(),
      },
    });
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
