import { prisma } from "@/lib/prisma";
import type { ContentFile } from "@/lib/content/collectMarkdown";
import type { Locale } from "@/lib/types";

function yamlQuote(value: string): string {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

function asLines(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(/\r?\n|,/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildFrontmatter(fields: Record<string, string | boolean | undefined>): string {
  const lines = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => {
      if (typeof value === "boolean") {
        return `${key}: ${value}`;
      }
      return `${key}: ${yamlQuote(String(value))}`;
    });

  return `---\n${lines.join("\n")}\n---\n\n`;
}

function toLocale(value: string): Locale {
  return value === "en" ? "en" : "fr";
}

export async function loadDatabaseContentFiles(
  locales: Locale[] = ["fr", "en"],
): Promise<{
  files: ContentFile[];
  counts: {
    projects: number;
    experiences: number;
    educations: number;
    services: number;
    articles: number;
  };
}> {
  const [
    projects,
    experiences,
    educations,
    services,
    articles,
  ] = await Promise.all([
    prisma.project.findMany({
      where: {
        locale: { in: locales },
        publishedAt: { not: null },
      },
      orderBy: [{ featured: "desc" }, { year: "desc" }],
    }),
    prisma.experience.findMany({
      where: {
        locale: { in: locales },
        publishedAt: { not: null },
      },
      orderBy: { order: "asc" },
    }),
    prisma.education.findMany({
      where: {
        locale: { in: locales },
        publishedAt: { not: null },
      },
      orderBy: { order: "asc" },
    }),
    prisma.service.findMany({
      where: {
        locale: { in: locales },
        publishedAt: { not: null },
      },
      orderBy: { order: "asc" },
    }),
    prisma.article.findMany({
      where: {
        locale: { in: locales },
        publishedAt: { not: null },
      },
      orderBy: { date: "desc" },
    }),
  ]);

  const files: ContentFile[] = [];

  for (const project of projects) {
    const locale = toLocale(project.locale);
    const stackLines = asLines(project.stack);
    const stackBlock =
      stackLines.length > 0
        ? `## Tech stack\n\n${stackLines.map((item) => `- ${item}`).join("\n")}`
        : "";
    const caseStudy = project.caseStudy?.trim()
      ? `## Case study\n\n${project.caseStudy.trim()}`
      : "";

    files.push({
      locale,
      source: `db/${locale}/projects/${project.slug}.md`,
      raw: `${buildFrontmatter({
        locale,
        type: "project",
        slug: project.slug,
        title: project.title,
        description: project.description,
        category: project.category,
        featured: project.featured,
        year: project.year,
      })}# ${project.title}

${project.description}

${caseStudy}

${stackBlock}
`.trim(),
    });
  }

  for (const experience of experiences) {
    const locale = toLocale(experience.locale);
    files.push({
      locale,
      source: `db/${locale}/experiences/${experience.key}.md`,
      raw: `${buildFrontmatter({
        locale,
        type: "experience",
        key: experience.key,
        role: experience.role,
        company: experience.company,
        period: experience.period,
      })}# ${experience.role} - ${experience.company}

**Period:** ${experience.period}
${experience.location ? `**Location:** ${experience.location}` : ""}

${experience.description}
`.trim(),
    });
  }

  for (const education of educations) {
    const locale = toLocale(education.locale);
    files.push({
      locale,
      source: `db/${locale}/educations/${education.key}.md`,
      raw: `${buildFrontmatter({
        locale,
        type: "education",
        key: education.key,
        degree: education.degree,
        school: education.school,
        period: education.period,
        status: education.status,
      })}# ${education.degree}

**School:** ${education.school}
**Period:** ${education.period}
${education.highlight ? `**Highlight:** ${education.highlight}` : ""}

${education.description}
`.trim(),
    });
  }

  for (const service of services) {
    const locale = toLocale(service.locale);
    const extras = [
      service.overview?.trim(),
      service.deliverables?.trim()
        ? `## Deliverables\n\n${service.deliverables.trim()}`
        : "",
      service.approach?.trim()
        ? `## Approach\n\n${service.approach.trim()}`
        : "",
      service.stack?.trim()
        ? `## Stack\n\n${asLines(service.stack)
            .map((item) => `- ${item}`)
            .join("\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    files.push({
      locale,
      source: `db/${locale}/services/${service.slug}.md`,
      raw: `${buildFrontmatter({
        locale,
        type: "service",
        slug: service.slug,
        title: service.title,
      })}# ${service.title}

${service.tagline ? `${service.tagline}\n\n` : ""}${service.summary}

${extras}
`.trim(),
    });
  }

  for (const article of articles) {
    const locale = toLocale(article.locale);
    files.push({
      locale,
      source: `db/${locale}/articles/${article.slug}.md`,
      raw: `${buildFrontmatter({
        locale,
        type: "article",
        slug: article.slug,
        title: article.title,
        category: article.category,
        date: article.date,
      })}# ${article.title}

${article.excerpt}

${article.content?.trim() ?? ""}
`.trim(),
    });
  }

  return {
    files,
    counts: {
      projects: projects.length,
      experiences: experiences.length,
      educations: educations.length,
      services: services.length,
      articles: articles.length,
    },
  };
}

/** Keep about.md bio/contact, drop career sections when DB already provides them. */
export function trimAboutMarkdownForDatabase(
  raw: string,
  options: { hasExperiences: boolean; hasEducations: boolean },
): string {
  if (!options.hasExperiences && !options.hasEducations) {
    return raw;
  }

  const match = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return raw;

  const frontmatterBlock = raw.slice(0, raw.indexOf(match[1]));
  let body = match[1];

  if (options.hasExperiences) {
    body = body.replace(
      /^## (Parcours professionnel|Professional experience|Experience)\b[\s\S]*?(?=^## |\Z)/im,
      "",
    );
  }

  if (options.hasEducations) {
    body = body.replace(
      /^## (Formation|Education|Éducation)\b[\s\S]*?(?=^## |\Z)/im,
      "",
    );
  }

  return `${frontmatterBlock}${body.trim()}\n`;
}
