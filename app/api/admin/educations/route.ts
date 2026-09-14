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
  degree?: string;
  school?: string;
  period?: string;
  description?: string;
  status?: string;
  highlight?: string | null;
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
    prisma.education.findMany({
      where: locale ? { locale } : undefined,
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
    }),
  create: async (data) => {
    if (isBilingualCreatePayload(data)) {
      const locales = data.locales;
      const degreeFr = localizedText(locales, "degree", "fr").trim();
      const degreeEn = localizedText(locales, "degree", "en").trim();
      if (!degreeFr || !degreeEn) {
        throw new Error("Les diplômes FR et EN sont requis");
      }

      const key =
        (typeof data.key === "string" && data.key.trim()) ||
        slugify(degreeFr);
      if (!key) throw new Error("Clé invalide");

      const shared = {
        status:
          typeof data.status === "string" && data.status
            ? data.status
            : "completed",
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
        prisma.education.create({
          data: {
            locale: "fr",
            key,
            degree: degreeFr,
            school: localizedText(locales, "school", "fr"),
            period: localizedText(locales, "period", "fr"),
            description: localizedText(locales, "description", "fr"),
            highlight: localizedText(locales, "highlight", "fr") || null,
            ...shared,
          },
        }),
        prisma.education.create({
          data: {
            locale: "en",
            key,
            degree: degreeEn,
            school: localizedText(locales, "school", "en"),
            period: localizedText(locales, "period", "en"),
            description: localizedText(locales, "description", "en"),
            highlight: localizedText(locales, "highlight", "en") || null,
            ...shared,
          },
        }),
      ]);
    }

    if (
      !data.key?.trim() ||
      !data.degree?.trim() ||
      !data.school?.trim() ||
      !data.period?.trim() ||
      !data.description?.trim()
    ) {
      throw new Error(
        "key, degree, school, period et description sont requis"
      );
    }

    return prisma.education.create({
      data: {
        locale: data.locale || "fr",
        key: data.key.trim(),
        degree: data.degree.trim(),
        school: data.school.trim(),
        period: data.period,
        description: data.description,
        status: data.status || "completed",
        highlight: data.highlight ?? null,
        order: data.order ?? 0,
        publishedAt:
          parsePublishedAt(data.publishedAt, data.publish) ?? new Date(),
      },
    });
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
