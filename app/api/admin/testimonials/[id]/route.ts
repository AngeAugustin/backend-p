import { prisma } from "@/lib/prisma";
import {
  createAdminItemHandlers,
  parsePublishedAt,
} from "@/lib/admin-crud";

type Body = {
  locale?: string;
  key?: string;
  quote?: string;
  author?: string;
  role?: string;
  order?: number;
  publishedAt?: string | null;
  publish?: boolean;
};

const handlers = createAdminItemHandlers<Body>({
  get: (id) => prisma.testimonial.findUnique({ where: { id } }),
  update: (id, data) =>
    prisma.testimonial.update({
      where: { id },
      data: {
        ...(data.locale !== undefined ? { locale: data.locale } : {}),
        ...(data.key !== undefined ? { key: data.key } : {}),
        ...(data.quote !== undefined ? { quote: data.quote } : {}),
        ...(data.author !== undefined ? { author: data.author } : {}),
        ...(data.role !== undefined ? { role: data.role } : {}),
        ...(data.order !== undefined ? { order: data.order } : {}),
        ...(data.publishedAt !== undefined || data.publish !== undefined
          ? { publishedAt: parsePublishedAt(data.publishedAt, data.publish) }
          : {}),
      },
    }),
  remove: (id) => prisma.testimonial.delete({ where: { id } }),
});

export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
