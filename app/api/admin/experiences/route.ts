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
  role?: string;
  company?: string;
  location?: string | null;
  period?: string;
  description?: string;
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
    prisma.experience.findMany({
      where: locale ? { locale } : undefined,
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
    }),
  create: async (data) => {
    if (isBilingualCreatePayload(data)) {
      const locales = data.locales;
      const roleFr = localizedText(locales, "role", "fr").trim();
      const roleEn = localizedText(locales, "role", "en").trim();
      if (!roleFr || !roleEn) {
        throw new Error("Les rôles FR et EN sont requis");
      }

      const key =
        (typeof data.key === "string" && data.key.trim()) || slugify(roleFr);
      if (!key) throw new Error("Clé invalide");

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
        prisma.experience.create({
          data: {
            locale: "fr",
            key,
            role: roleFr,
            company: localizedText(locales, "company", "fr"),
            location: localizedText(locales, "location", "fr") || null,
            period: localizedText(locales, "period", "fr"),
            description: localizedText(locales, "description", "fr"),
            ...shared,
          },
        }),
        prisma.experience.create({
          data: {
            locale: "en",
            key,
            role: roleEn,
            company: localizedText(locales, "company", "en"),
            location: localizedText(locales, "location", "en") || null,
            period: localizedText(locales, "period", "en"),
            description: localizedText(locales, "description", "en"),
            ...shared,
          },
        }),
      ]);
    }

    if (
      !data.key?.trim() ||
      !data.role?.trim() ||
      !data.company?.trim() ||
      !data.period?.trim() ||
      !data.description?.trim()
    ) {
      throw new Error("key, role, company, period et description sont requis");
    }

    return prisma.experience.create({
      data: {
        locale: data.locale || "fr",
        key: data.key.trim(),
        role: data.role.trim(),
        company: data.company.trim(),
        location: data.location ?? null,
        period: data.period,
        description: data.description,
        order: data.order ?? 0,
        publishedAt:
          parsePublishedAt(data.publishedAt, data.publish) ?? new Date(),
      },
    });
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
