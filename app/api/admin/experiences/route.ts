import { prisma } from "@/lib/prisma";
import {
  createAdminCollectionHandlers,
  parsePublishedAt,
} from "@/lib/admin-crud";

type Body = {
  locale?: string;
  key: string;
  role: string;
  company: string;
  period: string;
  description: string;
  order?: number;
  publishedAt?: string | null;
  publish?: boolean;
};

const handlers = createAdminCollectionHandlers<Body>({
  list: (locale) =>
    prisma.experience.findMany({
      where: locale ? { locale } : undefined,
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
    }),
  create: (data) =>
    prisma.experience.create({
      data: {
        locale: data.locale || "fr",
        key: data.key,
        role: data.role,
        company: data.company,
        period: data.period,
        description: data.description,
        order: data.order ?? 0,
        publishedAt: parsePublishedAt(data.publishedAt, data.publish) ?? new Date(),
      },
    }),
});

export const GET = handlers.GET;
export const POST = handlers.POST;
