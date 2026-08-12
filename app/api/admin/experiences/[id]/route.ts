import { prisma } from "@/lib/prisma";
import {
  createAdminItemHandlers,
  parsePublishedAt,
} from "@/lib/admin-crud";

type Body = {
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
};

const handlers = createAdminItemHandlers<Body>({
  get: (id) => prisma.experience.findUnique({ where: { id } }),
  update: (id, data) =>
    prisma.experience.update({
      where: { id },
      data: {
        ...(data.locale !== undefined ? { locale: data.locale } : {}),
        ...(data.key !== undefined ? { key: data.key } : {}),
        ...(data.role !== undefined ? { role: data.role } : {}),
        ...(data.company !== undefined ? { company: data.company } : {}),
        ...(data.location !== undefined ? { location: data.location } : {}),
        ...(data.period !== undefined ? { period: data.period } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.order !== undefined ? { order: data.order } : {}),
        ...(data.publishedAt !== undefined || data.publish !== undefined
          ? { publishedAt: parsePublishedAt(data.publishedAt, data.publish) }
          : {}),
      },
    }),
  remove: (id) => prisma.experience.delete({ where: { id } }),
});

export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
