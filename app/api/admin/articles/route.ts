import { prisma } from "@/lib/prisma";
import {
  createAdminCollectionHandlers,
  parsePublishedAt,
} from "@/lib/admin-crud";

type Body = {
  locale?: string;
  slug: string;
  title: string;
  excerpt: string;
  content?: string | null;
  category?: string;
  featured?: boolean;
  readMinutes?: number;
  date: string;
  imageUrl?: string | null;
  publishedAt?: string | null;
  publish?: boolean;
};

const handlers = createAdminCollectionHandlers<Body>({
  list: (locale) =>
    prisma.article.findMany({
      where: locale ? { locale } : undefined,
      orderBy: [{ date: "desc" }, { updatedAt: "desc" }],
    }),
  create: (data) =>
    prisma.article.create({
      data: {
        locale: data.locale || "fr",
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt,
        content: data.content ?? null,
        category: data.category || "frontend",
        featured: Boolean(data.featured),
        readMinutes: data.readMinutes ?? 5,
        date: data.date,
        imageUrl: data.imageUrl ?? null,
        publishedAt: parsePublishedAt(data.publishedAt, data.publish) ?? new Date(),
      },
    }),
});

export const GET = handlers.GET;
export const POST = handlers.POST;
