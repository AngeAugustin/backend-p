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
  summary?: string;
  tagline?: string | null;
  overview?: string | null;
  order?: number;
  tags?: string | null;
  deliverables?: string | null;
  approach?: string | null;
  stack?: string | null;
  idealFor?: string | null;
  publishedAt?: string | null;
  publish?: boolean;
  locales?: {
    fr: Record<string, unknown>;
    en: Record<string, unknown>;
  };
};

function localizedOptional(
  locales: { fr: Record<string, unknown>; en: Record<string, unknown> },
  field: string,
  locale: "fr" | "en"
) {
  return localizedText(locales, field, locale) || null;
}

const handlers = createAdminCollectionHandlers<Body>({
  list: (locale) =>
    prisma.service.findMany({
      where: locale ? { locale } : undefined,
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
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

      const shared = {
        order: typeof data.order === "number" ? data.order : 0,
        publishedAt:
          parsePublishedAt(
            typeof data.publishedAt === "string" || data.publishedAt === null
              ? data.publishedAt
              : undefined,
            typeof data.publish === "boolean" ? data.publish : undefined
          ) ?? new Date(),
      };

      return prisma.$transaction([
        prisma.service.create({
          data: {
            locale: "fr",
            slug,
            title: titleFr,
            summary: localizedText(locales, "summary", "fr"),
            tagline: localizedOptional(locales, "tagline", "fr"),
            overview: localizedOptional(locales, "overview", "fr"),
            tags: localizedOptional(locales, "tags", "fr"),
            deliverables: localizedOptional(locales, "deliverables", "fr"),
            approach: localizedOptional(locales, "approach", "fr"),
            stack: localizedOptional(locales, "stack", "fr"),
            idealFor: localizedOptional(locales, "idealFor", "fr"),
            ...shared,
          },
        }),
        prisma.service.create({
          data: {
            locale: "en",
            slug,
            title: titleEn,
            summary: localizedText(locales, "summary", "en"),
            tagline: localizedOptional(locales, "tagline", "en"),
            overview: localizedOptional(locales, "overview", "en"),
            tags: localizedOptional(locales, "tags", "en"),
            deliverables: localizedOptional(locales, "deliverables", "en"),
            approach: localizedOptional(locales, "approach", "en"),
            stack: localizedOptional(locales, "stack", "en"),
            idealFor: localizedOptional(locales, "idealFor", "en"),
            ...shared,
          },
        }),
      ]);
    }

    if (!data.slug?.trim() || !data.title?.trim() || !data.summary?.trim()) {
      throw new Error("slug, title et summary sont requis");
    }

    return prisma.service.create({
      data: {
        locale: data.locale || "fr",
        slug: data.slug.trim(),
        title: data.title.trim(),
        summary: data.summary,
        tagline: data.tagline ?? null,
        overview: data.overview ?? null,
        order: data.order ?? 0,
        tags: data.tags ?? null,
        deliverables: data.deliverables ?? null,
        approach: data.approach ?? null,
        stack: data.stack ?? null,
        idealFor: data.idealFor ?? null,
        publishedAt:
          parsePublishedAt(data.publishedAt, data.publish) ?? new Date(),
      },
    });
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
