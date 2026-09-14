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
  key?: string;
  quote?: string;
  author?: string;
  role?: string;
  order?: number;
  publishedAt?: string | null;
  publish?: boolean;
  locales?: {
    fr: Record<string, unknown>;
    en: Record<string, unknown>;
  };
};

const handlers = createAdminCollectionHandlers<Body>({
  list: (locale) =>
    prisma.testimonial.findMany({
      where: locale ? { locale } : undefined,
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
    }),
  create: async (data) => {
    if (isBilingualCreatePayload(data)) {
      const locales = data.locales;
      const quoteFr = localizedText(locales, "quote", "fr").trim();
      const quoteEn = localizedText(locales, "quote", "en").trim();
      const roleFr = localizedText(locales, "role", "fr").trim();
      const roleEn = localizedText(locales, "role", "en").trim();
      const author =
        typeof data.author === "string" ? data.author.trim() : "";

      if (!quoteFr || !quoteEn) {
        throw new Error("Les citations FR et EN sont requises");
      }
      if (!roleFr || !roleEn) {
        throw new Error("Les rôles FR et EN sont requis");
      }
      if (!author) throw new Error("L'auteur est requis");

      const key =
        (typeof data.key === "string" && data.key.trim()) ||
        slugify(author);
      if (!key) throw new Error("Clé invalide");

      const shared = {
        author,
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
        prisma.testimonial.create({
          data: {
            locale: "fr",
            key,
            quote: quoteFr,
            role: roleFr,
            ...shared,
          },
        }),
        prisma.testimonial.create({
          data: {
            locale: "en",
            key,
            quote: quoteEn,
            role: roleEn,
            ...shared,
          },
        }),
      ]);
    }

    if (
      !data.key?.trim() ||
      !data.quote?.trim() ||
      !data.author?.trim() ||
      !data.role?.trim()
    ) {
      throw new Error("key, quote, author et role sont requis");
    }

    return prisma.testimonial.create({
      data: {
        locale: data.locale || "fr",
        key: data.key.trim(),
        quote: data.quote,
        author: data.author.trim(),
        role: data.role.trim(),
        order: data.order ?? 0,
        publishedAt:
          parsePublishedAt(data.publishedAt, data.publish) ?? new Date(),
      },
    });
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
