import { prisma } from "@/lib/prisma";
import {
  createAdminItemHandlers,
  parsePublishedAt,
} from "@/lib/admin-crud";

type Body = {
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
};

const handlers = createAdminItemHandlers<Body>({
  get: (id) => prisma.education.findUnique({ where: { id } }),
  update: (id, data) =>
    prisma.education.update({
      where: { id },
      data: {
        ...(data.locale !== undefined ? { locale: data.locale } : {}),
        ...(data.key !== undefined ? { key: data.key } : {}),
        ...(data.degree !== undefined ? { degree: data.degree } : {}),
        ...(data.school !== undefined ? { school: data.school } : {}),
        ...(data.period !== undefined ? { period: data.period } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.highlight !== undefined ? { highlight: data.highlight } : {}),
        ...(data.order !== undefined ? { order: data.order } : {}),
        ...(data.publishedAt !== undefined || data.publish !== undefined
          ? { publishedAt: parsePublishedAt(data.publishedAt, data.publish) }
          : {}),
      },
    }),
  remove: (id) => prisma.education.delete({ where: { id } }),
});

export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
