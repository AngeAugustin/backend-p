import { prisma } from "@/lib/prisma";
import {
  createAdminItemHandlers,
  parsePublishedAt,
} from "@/lib/admin-crud";

type Body = {
  locale?: string;
  slug?: string;
  title?: string;
  description?: string;
  caseStudy?: string | null;
  category?: string;
  featured?: boolean;
  year?: string;
  stack?: string | null;
  imageUrl?: string | null;
  liveUrl?: string | null;
  repoUrl?: string | null;
  publishedAt?: string | null;
  publish?: boolean;
};

const handlers = createAdminItemHandlers<Body>({
  get: (id) => prisma.project.findUnique({ where: { id } }),
  update: (id, data) =>
    prisma.project.update({
      where: { id },
      data: {
        ...(data.locale !== undefined ? { locale: data.locale } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.caseStudy !== undefined ? { caseStudy: data.caseStudy } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.featured !== undefined ? { featured: data.featured } : {}),
        ...(data.year !== undefined ? { year: data.year } : {}),
        ...(data.stack !== undefined ? { stack: data.stack } : {}),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
        ...(data.liveUrl !== undefined ? { liveUrl: data.liveUrl } : {}),
        ...(data.repoUrl !== undefined ? { repoUrl: data.repoUrl } : {}),
        ...(data.publishedAt !== undefined || data.publish !== undefined
          ? { publishedAt: parsePublishedAt(data.publishedAt, data.publish) }
          : {}),
      },
    }),
  remove: (id) => prisma.project.delete({ where: { id } }),
});

export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
