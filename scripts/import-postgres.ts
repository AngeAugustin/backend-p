import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const prisma = new PrismaClient();

type ExportPayload = {
  adminUsers: Array<Record<string, unknown>>;
  projects: Array<Record<string, unknown>>;
  articles: Array<Record<string, unknown>>;
  services: Array<Record<string, unknown>>;
  experiences: Array<Record<string, unknown>>;
  testimonials: Array<Record<string, unknown>>;
  educations: Array<Record<string, unknown>>;
  contactMessages: Array<Record<string, unknown>>;
};

function toDate(value: unknown) {
  if (!value) return null;
  return new Date(String(value));
}

async function main() {
  const file = resolve(process.cwd(), "prisma", "sqlite-export.json");
  const data = JSON.parse(readFileSync(file, "utf8")) as ExportPayload;

  await prisma.$transaction([
    prisma.contactMessage.deleteMany(),
    prisma.education.deleteMany(),
    prisma.testimonial.deleteMany(),
    prisma.experience.deleteMany(),
    prisma.service.deleteMany(),
    prisma.article.deleteMany(),
    prisma.project.deleteMany(),
    prisma.adminUser.deleteMany(),
  ]);

  if (data.adminUsers.length) {
    await prisma.adminUser.createMany({
      data: data.adminUsers.map((row) => ({
        id: String(row.id),
        email: String(row.email),
        passwordHash: String(row.passwordHash),
        name: row.name ? String(row.name) : null,
        createdAt: toDate(row.createdAt) || new Date(),
        updatedAt: toDate(row.updatedAt) || new Date(),
      })),
    });
  }

  if (data.projects.length) {
    await prisma.project.createMany({
      data: data.projects.map((row) => ({
        id: String(row.id),
        locale: String(row.locale),
        slug: String(row.slug),
        title: String(row.title),
        description: String(row.description),
        caseStudy: row.caseStudy ? String(row.caseStudy) : null,
        category: String(row.category),
        featured: Boolean(row.featured),
        year: String(row.year),
        stack: row.stack ? String(row.stack) : null,
        imageUrl: row.imageUrl ? String(row.imageUrl) : null,
        coverUrl: row.coverUrl ? String(row.coverUrl) : null,
        liveUrl: row.liveUrl ? String(row.liveUrl) : null,
        repoUrl: row.repoUrl ? String(row.repoUrl) : null,
        publishedAt: toDate(row.publishedAt),
        createdAt: toDate(row.createdAt) || new Date(),
        updatedAt: toDate(row.updatedAt) || new Date(),
      })),
    });
  }

  if (data.articles.length) {
    await prisma.article.createMany({
      data: data.articles.map((row) => ({
        id: String(row.id),
        locale: String(row.locale),
        slug: String(row.slug),
        title: String(row.title),
        excerpt: String(row.excerpt),
        content: row.content ? String(row.content) : null,
        category: String(row.category),
        featured: Boolean(row.featured),
        readMinutes: Number(row.readMinutes || 5),
        date: String(row.date),
        imageUrl: row.imageUrl ? String(row.imageUrl) : null,
        coverUrl: row.coverUrl ? String(row.coverUrl) : null,
        publishedAt: toDate(row.publishedAt),
        createdAt: toDate(row.createdAt) || new Date(),
        updatedAt: toDate(row.updatedAt) || new Date(),
      })),
    });
  }

  if (data.services.length) {
    await prisma.service.createMany({
      data: data.services.map((row) => ({
        id: String(row.id),
        locale: String(row.locale),
        slug: String(row.slug),
        title: String(row.title),
        summary: String(row.summary),
        tagline: row.tagline ? String(row.tagline) : null,
        overview: row.overview ? String(row.overview) : null,
        order: Number(row.order || 0),
        tags: row.tags ? String(row.tags) : null,
        deliverables: row.deliverables ? String(row.deliverables) : null,
        approach: row.approach ? String(row.approach) : null,
        stack: row.stack ? String(row.stack) : null,
        idealFor: row.idealFor ? String(row.idealFor) : null,
        publishedAt: toDate(row.publishedAt),
        createdAt: toDate(row.createdAt) || new Date(),
        updatedAt: toDate(row.updatedAt) || new Date(),
      })),
    });
  }

  if (data.experiences.length) {
    await prisma.experience.createMany({
      data: data.experiences.map((row) => ({
        id: String(row.id),
        locale: String(row.locale),
        key: String(row.key),
        role: String(row.role),
        company: String(row.company),
        period: String(row.period),
        description: String(row.description),
        order: Number(row.order || 0),
        publishedAt: toDate(row.publishedAt),
        createdAt: toDate(row.createdAt) || new Date(),
        updatedAt: toDate(row.updatedAt) || new Date(),
      })),
    });
  }

  if (data.testimonials.length) {
    await prisma.testimonial.createMany({
      data: data.testimonials.map((row) => ({
        id: String(row.id),
        locale: String(row.locale),
        key: String(row.key),
        quote: String(row.quote),
        author: String(row.author),
        role: String(row.role),
        order: Number(row.order || 0),
        publishedAt: toDate(row.publishedAt),
        createdAt: toDate(row.createdAt) || new Date(),
        updatedAt: toDate(row.updatedAt) || new Date(),
      })),
    });
  }

  if (data.educations.length) {
    await prisma.education.createMany({
      data: data.educations.map((row) => ({
        id: String(row.id),
        locale: String(row.locale),
        key: String(row.key),
        degree: String(row.degree),
        school: String(row.school),
        period: String(row.period),
        description: String(row.description),
        status: String(row.status || "completed"),
        highlight: row.highlight ? String(row.highlight) : null,
        order: Number(row.order || 0),
        publishedAt: toDate(row.publishedAt),
        createdAt: toDate(row.createdAt) || new Date(),
        updatedAt: toDate(row.updatedAt) || new Date(),
      })),
    });
  }

  if (data.contactMessages.length) {
    await prisma.contactMessage.createMany({
      data: data.contactMessages.map((row) => ({
        id: String(row.id),
        name: String(row.name),
        email: String(row.email),
        message: String(row.message),
        locale: String(row.locale || "fr"),
        status: String(row.status || "new"),
        createdAt: toDate(row.createdAt) || new Date(),
        updatedAt: toDate(row.updatedAt) || new Date(),
      })),
    });
  }

  const counts = {
    adminUsers: await prisma.adminUser.count(),
    projects: await prisma.project.count(),
    articles: await prisma.article.count(),
    services: await prisma.service.count(),
    experiences: await prisma.experience.count(),
    testimonials: await prisma.testimonial.count(),
    educations: await prisma.education.count(),
    contactMessages: await prisma.contactMessage.count(),
  };

  console.log("Import completed:", counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
