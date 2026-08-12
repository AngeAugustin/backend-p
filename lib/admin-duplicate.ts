import { prisma } from "@/lib/prisma";

const DUPLICATE_SUFFIX = () => `-copy-${Date.now().toString(36)}`;

function duplicateKey(base: string) {
  const suffix = DUPLICATE_SUFFIX();
  const maxBaseLength = Math.max(1, 191 - suffix.length);
  return `${base.slice(0, maxBaseLength)}${suffix}`;
}

function copyLabel(value: string) {
  return value.endsWith(" (copie)") ? value : `${value} (copie)`;
}

export async function duplicateProject(id: string) {
  const source = await prisma.project.findUnique({ where: { id } });
  if (!source) return null;

  const created = await prisma.project.create({
    data: {
      locale: source.locale,
      slug: duplicateKey(source.slug),
      title: copyLabel(source.title),
      description: source.description,
      caseStudy: source.caseStudy,
      category: source.category,
      featured: source.featured,
      year: source.year,
      stack: source.stack,
      imageUrl: source.imageUrl,
      coverUrl: source.coverUrl,
      liveUrl: source.liveUrl,
      repoUrl: source.repoUrl,
      publishedAt: null,
    },
  });

  return { id: created.id };
}

export async function duplicateArticle(id: string) {
  const source = await prisma.article.findUnique({ where: { id } });
  if (!source) return null;

  const created = await prisma.article.create({
    data: {
      locale: source.locale,
      slug: duplicateKey(source.slug),
      title: copyLabel(source.title),
      excerpt: source.excerpt,
      content: source.content,
      category: source.category,
      featured: source.featured,
      readMinutes: source.readMinutes,
      date: source.date,
      imageUrl: source.imageUrl,
      coverUrl: source.coverUrl,
      publishedAt: null,
    },
  });

  return { id: created.id };
}

export async function duplicateExperience(id: string) {
  const source = await prisma.experience.findUnique({ where: { id } });
  if (!source) return null;

  const created = await prisma.experience.create({
    data: {
      locale: source.locale,
      key: duplicateKey(source.key),
      role: copyLabel(source.role),
      company: source.company,
      location: source.location,
      period: source.period,
      description: source.description,
      order: source.order,
      publishedAt: null,
    },
  });

  return { id: created.id };
}

export async function duplicateEducation(id: string) {
  const source = await prisma.education.findUnique({ where: { id } });
  if (!source) return null;

  const created = await prisma.education.create({
    data: {
      locale: source.locale,
      key: duplicateKey(source.key),
      degree: copyLabel(source.degree),
      school: source.school,
      period: source.period,
      description: source.description,
      status: source.status,
      highlight: source.highlight,
      order: source.order,
      publishedAt: null,
    },
  });

  return { id: created.id };
}

export async function duplicateAdminResource(resource: string, id: string) {
  switch (resource) {
    case "projects":
      return duplicateProject(id);
    case "articles":
      return duplicateArticle(id);
    case "experiences":
      return duplicateExperience(id);
    case "educations":
      return duplicateEducation(id);
    default:
      return null;
  }
}
