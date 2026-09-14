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
  description?: string;
  caseStudy?: string | null;
  category?: string;
  featured?: boolean;
  year?: string;
  stack?: string | null;
  imageUrl?: string | null;
  liveUrl?: string | null;
  repoUrl?: string | null;
  publishedAt?: string | null;
  publish?: boolean;
  locales?: {
    fr: Record<string, unknown>;
    en: Record<string, unknown>;
  };
};

function sharedFromBody(data: Body) {
  return {
    category: data.category || "web",
    featured: Boolean(data.featured),
    year: data.year || String(new Date().getFullYear()),
    imageUrl: data.imageUrl ?? null,
    liveUrl: data.liveUrl ?? null,
    repoUrl: data.repoUrl ?? null,
    publishedAt: parsePublishedAt(data.publishedAt, data.publish) ?? new Date(),
  };
}

const handlers = createAdminCollectionHandlers<Body>({
  list: (locale) =>
    prisma.project.findMany({
      where: locale ? { locale } : undefined,
      orderBy: [{ year: "desc" }, { updatedAt: "desc" }],
    }),
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
        prisma.project.create({
          data: {
            locale: "fr",
            slug,
            title: titleFr,
            description: localizedText(locales, "description", "fr"),
            caseStudy: localizedText(locales, "caseStudy", "fr") || null,
            stack: localizedText(locales, "stack", "fr") || null,
            ...shared,
          },
        }),
        prisma.project.create({
          data: {
            locale: "en",
            slug,
            title: titleEn,
            description: localizedText(locales, "description", "en"),
            caseStudy: localizedText(locales, "caseStudy", "en") || null,
            stack: localizedText(locales, "stack", "en") || null,
            ...shared,
          },
        }),
      ]);
    }

    if (!data.slug?.trim() || !data.title?.trim() || !data.description?.trim()) {
      throw new Error("slug, title et description sont requis");
    }

    return prisma.project.create({
      data: {
        locale: data.locale || "fr",
        slug: data.slug.trim(),
        title: data.title.trim(),
        description: data.description,
        caseStudy: data.caseStudy ?? null,
        category: data.category || "web",
        featured: Boolean(data.featured),
        year: data.year || String(new Date().getFullYear()),
        stack: data.stack ?? null,
        imageUrl: data.imageUrl ?? null,
        liveUrl: data.liveUrl ?? null,
        repoUrl: data.repoUrl ?? null,
        publishedAt:
          parsePublishedAt(data.publishedAt, data.publish) ?? new Date(),
      },
    });
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
