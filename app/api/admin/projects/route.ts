import { prisma } from "@/lib/prisma";
import {
  createAdminCollectionHandlers,
  parsePublishedAt,
} from "@/lib/admin-crud";

type Body = {
  locale?: string;
  slug: string;
  title: string;
  description: string;
  caseStudy?: string | null;
  category?: string;
  featured?: boolean;
  year: string;
  stack?: string | null;
  imageUrl?: string | null;
  liveUrl?: string | null;
  repoUrl?: string | null;
  publishedAt?: string | null;
  publish?: boolean;
};

const handlers = createAdminCollectionHandlers<Body>({
  list: (locale) =>
    prisma.project.findMany({
      where: locale ? { locale } : undefined,
      orderBy: [{ year: "desc" }, { updatedAt: "desc" }],
    }),
  create: (data) =>
    prisma.project.create({
      data: {
        locale: data.locale || "fr",
        slug: data.slug,
        title: data.title,
        description: data.description,
        caseStudy: data.caseStudy ?? null,
        category: data.category || "web",
        featured: Boolean(data.featured),
        year: data.year,
        stack: data.stack ?? null,
        imageUrl: data.imageUrl ?? null,
        liveUrl: data.liveUrl ?? null,
        repoUrl: data.repoUrl ?? null,
        publishedAt: parsePublishedAt(data.publishedAt, data.publish) ?? new Date(),
      },
    }),
});

export const GET = handlers.GET;
export const POST = handlers.POST;
