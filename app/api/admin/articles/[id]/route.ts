import { prisma } from "@/lib/prisma";
import {
  createAdminItemHandlers,
  parsePublishedAt,
} from "@/lib/admin-crud";

type Body = {
  locale?: string;
  slug?: string;
  title?: string;
  excerpt?: string;
  content?: string | null;
  category?: string;
  featured?: boolean;
  readMinutes?: number;
  date?: string;
  imageUrl?: string | null;
  publishedAt?: string | null;
  publish?: boolean;
};

const handlers = createAdminItemHandlers<Body>({
  get: (id) => prisma.article.findUnique({ where: { id } }),
  update: (id, data) =>
    prisma.article.update({
      where: { id },
      data: {
        ...(data.locale !== undefined ? { locale: data.locale } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.excerpt !== undefined ? { excerpt: data.excerpt } : {}),
        ...(data.content !== undefined ? { content: data.content } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.featured !== undefined ? { featured: data.featured } : {}),
        ...(data.readMinutes !== undefined
          ? { readMinutes: data.readMinutes }
          : {}),
        ...(data.date !== undefined ? { date: data.date } : {}),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
        ...(data.publishedAt !== undefined || data.publish !== undefined
          ? { publishedAt: parsePublishedAt(data.publishedAt, data.publish) }
          : {}),
      },
    }),
  remove: (id) => prisma.article.delete({ where: { id } }),
});

export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
