import { prisma } from "@/lib/prisma";
import {
  createAdminCollectionHandlers,
  parsePublishedAt,
} from "@/lib/admin-crud";

type Body = {
  locale?: string;
  key: string;
  degree: string;
  school: string;
  period: string;
  description: string;
  status?: string;
  highlight?: string | null;
  order?: number;
  publishedAt?: string | null;
  publish?: boolean;
};

const handlers = createAdminCollectionHandlers<Body>({
  list: (locale) =>
    prisma.education.findMany({
      where: locale ? { locale } : undefined,
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
    }),
  create: (data) =>
    prisma.education.create({
      data: {
        locale: data.locale || "fr",
        key: data.key,
        degree: data.degree,
        school: data.school,
        period: data.period,
        description: data.description,
        status: data.status || "completed",
        highlight: data.highlight ?? null,
        order: data.order ?? 0,
        publishedAt: parsePublishedAt(data.publishedAt, data.publish) ?? new Date(),
      },
    }),
});

export const GET = handlers.GET;
export const POST = handlers.POST;
