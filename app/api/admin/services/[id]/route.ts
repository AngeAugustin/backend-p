import { prisma } from "@/lib/prisma";
import {
  createAdminItemHandlers,
  parsePublishedAt,
} from "@/lib/admin-crud";

type Body = {
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
};

const handlers = createAdminItemHandlers<Body>({
  get: (id) => prisma.service.findUnique({ where: { id } }),
  update: (id, data) =>
    prisma.service.update({
      where: { id },
      data: {
        ...(data.locale !== undefined ? { locale: data.locale } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.summary !== undefined ? { summary: data.summary } : {}),
        ...(data.tagline !== undefined ? { tagline: data.tagline } : {}),
        ...(data.overview !== undefined ? { overview: data.overview } : {}),
        ...(data.order !== undefined ? { order: data.order } : {}),
        ...(data.tags !== undefined ? { tags: data.tags } : {}),
        ...(data.deliverables !== undefined
          ? { deliverables: data.deliverables }
          : {}),
        ...(data.approach !== undefined ? { approach: data.approach } : {}),
        ...(data.stack !== undefined ? { stack: data.stack } : {}),
        ...(data.idealFor !== undefined ? { idealFor: data.idealFor } : {}),
        ...(data.publishedAt !== undefined || data.publish !== undefined
          ? { publishedAt: parsePublishedAt(data.publishedAt, data.publish) }
          : {}),
      },
    }),
  remove: (id) => prisma.service.delete({ where: { id } }),
});

export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
