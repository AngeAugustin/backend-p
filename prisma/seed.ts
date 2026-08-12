import "dotenv/config";
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const require = createRequire(import.meta.url);
const seedData = require("../../Portfolio-backend/src/seed/data.js") as {
  projects: Array<Record<string, unknown>>;
  services: Array<Record<string, unknown>>;
  experiences: Array<Record<string, unknown>>;
  testimonials: Array<Record<string, unknown>>;
  educations: Array<Record<string, unknown>>;
  articles: Array<Record<string, unknown>>;
  contactMessages: Array<Record<string, unknown>>;
};

const prisma = new PrismaClient();
const locales = ["fr", "en"] as const;

type LocaleBlock = Record<string, unknown>;

function asLocale(entry: Record<string, unknown>, locale: "fr" | "en") {
  return (entry[locale] || {}) as LocaleBlock;
}

async function upsertLocales() {
  const now = new Date();

  for (const project of seedData.projects) {
    for (const locale of locales) {
      const localized = asLocale(project, locale);
      const slug = String(project.slug);
      await prisma.project.upsert({
        where: { slug_locale: { slug, locale } },
        update: {
          title: String(localized.title || ""),
          description: String(localized.description || ""),
          caseStudy: localized.caseStudy ? String(localized.caseStudy) : null,
          category: String(project.category || "web"),
          featured: Boolean(project.featured),
          year: String(project.year || ""),
          stack: project.stack ? String(project.stack) : null,
          imageUrl: project.imageUrl ? String(project.imageUrl) : null,
          liveUrl: project.liveUrl ? String(project.liveUrl) : null,
          repoUrl: project.repoUrl ? String(project.repoUrl) : null,
          publishedAt: now,
        },
        create: {
          slug,
          locale,
          title: String(localized.title || ""),
          description: String(localized.description || ""),
          caseStudy: localized.caseStudy ? String(localized.caseStudy) : null,
          category: String(project.category || "web"),
          featured: Boolean(project.featured),
          year: String(project.year || ""),
          stack: project.stack ? String(project.stack) : null,
          imageUrl: project.imageUrl ? String(project.imageUrl) : null,
          liveUrl: project.liveUrl ? String(project.liveUrl) : null,
          repoUrl: project.repoUrl ? String(project.repoUrl) : null,
          publishedAt: now,
        },
      });
    }
  }

  for (const service of seedData.services) {
    for (const locale of locales) {
      const localized = asLocale(service, locale);
      const slug = String(service.slug);
      await prisma.service.upsert({
        where: { slug_locale: { slug, locale } },
        update: {
          title: String(localized.title || ""),
          summary: String(localized.summary || ""),
          tagline: localized.tagline ? String(localized.tagline) : null,
          overview: localized.overview ? String(localized.overview) : null,
          order: Number(service.order || 0),
          tags: localized.tags ? String(localized.tags) : null,
          deliverables: localized.deliverables
            ? String(localized.deliverables)
            : null,
          approach: localized.approach ? String(localized.approach) : null,
          stack: service.stack ? String(service.stack) : null,
          idealFor: localized.idealFor ? String(localized.idealFor) : null,
          publishedAt: now,
        },
        create: {
          slug,
          locale,
          title: String(localized.title || ""),
          summary: String(localized.summary || ""),
          tagline: localized.tagline ? String(localized.tagline) : null,
          overview: localized.overview ? String(localized.overview) : null,
          order: Number(service.order || 0),
          tags: localized.tags ? String(localized.tags) : null,
          deliverables: localized.deliverables
            ? String(localized.deliverables)
            : null,
          approach: localized.approach ? String(localized.approach) : null,
          stack: service.stack ? String(service.stack) : null,
          idealFor: localized.idealFor ? String(localized.idealFor) : null,
          publishedAt: now,
        },
      });
    }
  }

  for (const experience of seedData.experiences) {
    for (const locale of locales) {
      const localized = asLocale(experience, locale);
      const key = String(experience.key);
      await prisma.experience.upsert({
        where: { key_locale: { key, locale } },
        update: {
          role: String(localized.role || ""),
          company: String(experience.company || localized.company || ""),
          location: experience.location ? String(experience.location) : null,
          period: String(localized.period || ""),
          description: String(localized.description || ""),
          order: Number(experience.order || 0),
          publishedAt: now,
        },
        create: {
          key,
          locale,
          role: String(localized.role || ""),
          company: String(experience.company || localized.company || ""),
          location: experience.location ? String(experience.location) : null,
          period: String(localized.period || ""),
          description: String(localized.description || ""),
          order: Number(experience.order || 0),
          publishedAt: now,
        },
      });
    }
  }

  for (const testimonial of seedData.testimonials) {
    for (const locale of locales) {
      const localized = asLocale(testimonial, locale);
      const key = String(testimonial.key);
      await prisma.testimonial.upsert({
        where: { key_locale: { key, locale } },
        update: {
          quote: String(localized.quote || ""),
          author: String(testimonial.author || ""),
          role: String(localized.role || ""),
          order: Number(testimonial.order || 0),
          publishedAt: now,
        },
        create: {
          key,
          locale,
          quote: String(localized.quote || ""),
          author: String(testimonial.author || ""),
          role: String(localized.role || ""),
          order: Number(testimonial.order || 0),
          publishedAt: now,
        },
      });
    }
  }

  for (const education of seedData.educations) {
    for (const locale of locales) {
      const localized = asLocale(education, locale);
      const key = String(education.key);
      await prisma.education.upsert({
        where: { key_locale: { key, locale } },
        update: {
          degree: String(localized.degree || ""),
          school: String(localized.school || education.school || ""),
          period: String(localized.period || ""),
          description: String(localized.description || ""),
          status: String(education.status || "completed"),
          highlight: localized.highlight ? String(localized.highlight) : null,
          order: Number(education.order || 0),
          publishedAt: now,
        },
        create: {
          key,
          locale,
          degree: String(localized.degree || ""),
          school: String(localized.school || education.school || ""),
          period: String(localized.period || ""),
          description: String(localized.description || ""),
          status: String(education.status || "completed"),
          highlight: localized.highlight ? String(localized.highlight) : null,
          order: Number(education.order || 0),
          publishedAt: now,
        },
      });
    }
  }

  for (const article of seedData.articles) {
    for (const locale of locales) {
      const localized = asLocale(article, locale);
      const slug = String(article.slug);
      await prisma.article.upsert({
        where: { slug_locale: { slug, locale } },
        update: {
          title: String(localized.title || ""),
          excerpt: String(localized.excerpt || ""),
          content: localized.content ? String(localized.content) : null,
          category: String(article.category || "frontend"),
          featured: Boolean(article.featured),
          readMinutes: Number(article.readMinutes || 5),
          date: String(article.date || ""),
          imageUrl: article.imageUrl ? String(article.imageUrl) : null,
          publishedAt: now,
        },
        create: {
          slug,
          locale,
          title: String(localized.title || ""),
          excerpt: String(localized.excerpt || ""),
          content: localized.content ? String(localized.content) : null,
          category: String(article.category || "frontend"),
          featured: Boolean(article.featured),
          readMinutes: Number(article.readMinutes || 5),
          date: String(article.date || ""),
          imageUrl: article.imageUrl ? String(article.imageUrl) : null,
          publishedAt: now,
        },
      });
    }
  }

  for (const message of seedData.contactMessages) {
    const existing = await prisma.contactMessage.findFirst({
      where: {
        email: String(message.email),
        message: String(message.message),
      },
    });
    if (!existing) {
      await prisma.contactMessage.create({
        data: {
          name: String(message.name),
          email: String(message.email),
          message: String(message.message),
          locale: String(message.locale || "fr"),
          status: String(message.status || "new"),
        },
      });
    }
  }
}

async function ensureAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@portfolio.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, name: "Admin" },
    create: { email, passwordHash, name: "Admin" },
  });

  console.log(`Admin ready: ${email} / ${password}`);
}

async function main() {
  await ensureAdmin();
  await upsertLocales();
  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
