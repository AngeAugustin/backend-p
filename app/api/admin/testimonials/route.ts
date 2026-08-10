import { prisma } from "@/lib/prisma";
import {
  createAdminCollectionHandlers,
  parsePublishedAt,
} from "@/lib/admin-crud";

type Body = {
  locale?: string;
  key: string;
  quote: string;
  author: string;
  role: string;
  order?: number;
  publishedAt?: string | null;
  publish?: boolean;
};

const handlers = createAdminCollectionHandlers<Body>({
  list: (locale) =>
    prisma.testimonial.findMany({
      where: locale ? { locale } : undefined,
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
    }),
  create: (data) =>
    prisma.testimonial.create({
      data: {
        locale: data.locale || "fr",
        key: data.key,
        quote: data.quote,
        author: data.author,
        role: data.role,
        order: data.order ?? 0,
        publishedAt: parsePublishedAt(data.publishedAt, data.publish) ?? new Date(),
      },
    }),
});

export const GET = handlers.GET;
export const POST = handlers.POST;
