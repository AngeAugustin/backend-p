import { loadContentFiles } from "@/lib/content/collectMarkdown";
import { parseFrontmatter } from "@/lib/content/parseMarkdown";
import { suggestedQuestions } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/types";

export type FaqTopic = "projects" | "skills" | "contact";
export type ProjectFilter = "all" | "ai";

type FaqMatch =
  | { topic: "contact" | "skills" }
  | { topic: "projects"; filter: ProjectFilter };

const replyCache = new Map<string, string>();

const AI_QUERY_PATTERN =
  /\b(ia|ai|llm|rag|ml|machine learning|intelligence artificielle)\b/;
const OTHER_PROJECT_FILTER_PATTERN =
  /\b(react|django|next|nestjs|nest|symfony|python|java|mobile|data|devops|fullstack|full.?stack)\b/;

function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function detectProjectFilter(normalized: string): ProjectFilter | null {
  if (AI_QUERY_PATTERN.test(normalized)) {
    return "ai";
  }

  // Specific tech/theme filters are left to RAG for better context matching.
  if (OTHER_PROJECT_FILTER_PATTERN.test(normalized)) {
    return null;
  }

  return "all";
}

function isAiProject(project: {
  category: string;
  title: string;
  description: string;
  stack: string;
}): boolean {
  if (project.category === "ai") return true;

  const haystack = normalize(
    `${project.title} ${project.description} ${project.stack}`,
  );

  return AI_QUERY_PATTERN.test(haystack);
}

function matchBySuggestion(message: string, locale: Locale): FaqMatch | null {
  const normalized = normalize(message);

  for (const question of suggestedQuestions) {
    if (normalize(question.label[locale]) !== normalized) continue;

    if (question.id === "projects") {
      return { topic: "projects", filter: "all" };
    }

    if (question.id === "skills" || question.id === "contact") {
      return { topic: question.id };
    }
  }

  return null;
}

function matchByPattern(message: string): FaqMatch | null {
  const normalized = normalize(message);

  if (
    /\b(contact|contacter|joindre|reach|email|mail|linkedin|github|ecrire|message)\b/.test(
      normalized,
    )
  ) {
    return { topic: "contact" };
  }

  if (
    /\b(stack|competence|competences|skill|skills|technolog|expertise|outil|tools)\b/.test(
      normalized,
    )
  ) {
    return { topic: "skills" };
  }

  if (
    /\b(projet|projets|project|projects|realis|portfolio|built|build|application)\b/.test(
      normalized,
    )
  ) {
    const filter = detectProjectFilter(normalized);
    if (!filter) return null;
    return { topic: "projects", filter };
  }

  return null;
}

export function matchFaqTopic(message: string, locale: Locale): FaqTopic | null {
  return matchFaq(message, locale)?.topic ?? null;
}

function matchFaq(message: string, locale: Locale): FaqMatch | null {
  return matchBySuggestion(message, locale) ?? matchByPattern(message);
}

async function loadLocaleFiles(locale: Locale) {
  return loadContentFiles([locale]);
}

function formatEmailLink(email: string): string {
  return `[${email}](mailto:${email})`;
}

function formatWebLink(url: string, label?: string): string {
  let display = label;

  if (!display) {
    try {
      display = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      display = url;
    }
  }

  return `[${display}](${url})`;
}

async function buildContactReply(locale: Locale): Promise<string> {
  const cacheKey = `${locale}:contact:v3`;
  const cached = replyCache.get(cacheKey);
  if (cached) return cached;

  const files = await loadLocaleFiles(locale);
  const about = files.find((file) => file.source.endsWith(`${locale}/about.md`));
  const { frontmatter } = parseFrontmatter(about?.raw ?? "");

  const email = frontmatter.email ?? "me@augustinfachehoun.pro";
  const website = frontmatter.website ?? "https://augustinfachehoun.pro";
  const github = frontmatter.github ?? "https://github.com/AngeAugustin";
  const linkedin =
    frontmatter.linkedin ??
    "https://www.linkedin.com/in/augustinfachehoun/";
  const location = frontmatter.location ?? (locale === "fr" ? "Cotonou, Bénin" : "Cotonou, Benin");

  const reply =
    locale === "fr"
      ? `Vous pouvez me contacter via :

- **Email** : ${formatEmailLink(email)}
- **Site web** : ${formatWebLink(website)}
- **LinkedIn** : ${formatWebLink(linkedin, "LinkedIn")}
- **GitHub** : ${formatWebLink(github, "GitHub")}
- **Localisation** : ${location}

Pour une opportunité professionnelle, l'email reste le canal le plus direct.`
      : `You can reach me via:

- **Email**: ${formatEmailLink(email)}
- **Website**: ${formatWebLink(website)}
- **LinkedIn**: ${formatWebLink(linkedin, "LinkedIn")}
- **GitHub**: ${formatWebLink(github, "GitHub")}
- **Location**: ${location}

For professional opportunities, email is the most direct channel.`;

  replyCache.set(cacheKey, reply);
  return reply;
}

function extractStackHighlights(body: string, locale: Locale): string[] {
  const sections = body.split(/^### /m).slice(1);
  const highlights: string[] = [];
  const strongLevels =
    locale === "fr" ? /^(Expert|Avancé)$/i : /^(Expert|Advanced)$/i;

  for (const section of sections) {
    const [titleLine, ...rest] = section.split("\n");
    const title = titleLine.trim();
    const skills: string[] = [];

    for (const line of rest) {
      const match = line.match(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/);
      if (!match) continue;

      const skill = match[1].trim();
      const level = match[2].trim();

      if (skill === "Compétence" || skill === "Skill") continue;
      if (!strongLevels.test(level)) continue;

      skills.push(skill);
    }

    if (skills.length > 0) {
      highlights.push(`**${title}** - ${skills.slice(0, 6).join(", ")}`);
    }
  }

  return highlights;
}

async function buildSkillsReply(locale: Locale): Promise<string> {
  const cacheKey = `${locale}:skills:v3`;
  const cached = replyCache.get(cacheKey);
  if (cached) return cached;

  const files = await loadLocaleFiles(locale);
  const skillsFile = files.find((file) => file.source.endsWith(`${locale}/skills.md`));
  const { body } = parseFrontmatter(skillsFile?.raw ?? "");
  const highlights = extractStackHighlights(body, locale);

  const reply =
    locale === "fr"
      ? `Voici ma stack principale :

${highlights.map((line) => `- ${line}`).join("\n")}

Je travaille aussi avec Docker, CI/CD, Vercel et des pipelines data (Airflow, dbt, ETL/ELT).`
      : `Here is my core stack:

${highlights.map((line) => `- ${line}`).join("\n")}

I also work with Docker, CI/CD, Vercel, and data pipelines (Airflow, dbt, ETL/ELT).`;

  replyCache.set(cacheKey, reply);
  return reply;
}

type ProjectSummary = {
  title: string;
  description: string;
  year: string;
  featured: boolean;
  category: string;
  stack: string;
};

async function loadProjectsForFaq(locale: Locale): Promise<ProjectSummary[]> {
  try {
    const rows = await prisma.project.findMany({
      where: {
        locale,
        publishedAt: { not: null },
      },
      orderBy: [{ featured: "desc" }, { year: "desc" }],
    });

    if (rows.length > 0) {
      return rows.map((row) => ({
        title: row.title,
        description: row.description,
        year: row.year,
        featured: row.featured,
        category: row.category.trim().toLowerCase(),
        stack: row.stack ?? "",
      }));
    }
  } catch {
    // Fall back to markdown if DB is unavailable.
  }

  const files = await loadLocaleFiles(locale);
  return files
    .filter((file) => file.source.includes(`${locale}/projects/`))
    .map((file) => {
      const { frontmatter } = parseFrontmatter(file.raw);
      return {
        title:
          frontmatter.title?.trim() ??
          file.source.split("/").pop()?.replace(".md", "") ??
          "Project",
        description: frontmatter.description?.trim() ?? "",
        year: frontmatter.year?.trim() ?? "",
        featured: frontmatter.featured === "true",
        category: frontmatter.category?.trim().toLowerCase() ?? "",
        stack: frontmatter.stack?.toString() ?? "",
      };
    });
}

async function buildProjectsReply(
  locale: Locale,
  filter: ProjectFilter = "all",
): Promise<string> {
  const cacheKey = `${locale}:projects:v5:${filter}`;
  const cached = replyCache.get(cacheKey);
  if (cached) return cached;

  const projects = (await loadProjectsForFaq(locale))
    .filter((project) => (filter === "ai" ? isAiProject(project) : true))
    .sort((a, b) => {
      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1;
      }

      return Number(b.year) - Number(a.year);
    });

  if (projects.length === 0) {
    const emptyReply =
      locale === "fr"
        ? "Je n'ai pas trouvé de projet correspondant dans le portfolio. Parcourez la page Projets ou précisez un peu plus votre demande."
        : "I couldn't find a matching project in the portfolio. Browse the Projects page or give a bit more detail.";
    replyCache.set(cacheKey, emptyReply);
    return emptyReply;
  }

  const highlighted = projects.slice(0, 3);
  const hasMore = projects.length > highlighted.length;

  const lines = highlighted.map((project) => {
    const year = project.year ? ` (${project.year})` : "";
    const description = project.description ? ` - ${project.description}` : "";
    return `- **${project.title}**${year}${description}`;
  });

  const intro =
    locale === "fr"
      ? filter === "ai"
        ? "Voici quelques-uns de mes projets IA :"
        : "Voici quelques-uns de mes projets :"
      : filter === "ai"
        ? "Here are a few of my AI projects:"
        : "Here are a few of my projects:";

  const moreParagraph =
    locale === "fr"
      ? filter === "ai"
        ? "Il y en a encore bien d'autres projets liés à l'IA — vous pouvez tous les découvrir sur la page Projets du portfolio, avec stack, contexte et résultats."
        : "Il y en a encore bien d'autres — vous pouvez tous les découvrir sur la page Projets du portfolio, avec stack, contexte et résultats."
      : filter === "ai"
        ? "There are many more AI-related projects — you can browse them all on the Projects page of the portfolio, with stack, context, and outcomes."
        : "There are many more — you can browse them all on the Projects page of the portfolio, with stack, context, and outcomes.";

  const closing =
    locale === "fr"
      ? "Chaque projet est documenté sur le portfolio avec stack, contexte et résultats."
      : "Each project is documented on the portfolio with stack, context, and outcomes.";

  const reply = `${intro}

${lines.join("\n")}

${hasMore ? moreParagraph : closing}`;

  replyCache.set(cacheKey, reply);
  return reply;
}

export async function getFaqReply(
  locale: Locale,
  message: string,
): Promise<string | null> {
  const match = matchFaq(message, locale);
  if (!match) return null;

  switch (match.topic) {
    case "contact":
      return buildContactReply(locale);
    case "skills":
      return buildSkillsReply(locale);
    case "projects":
      return buildProjectsReply(locale, match.filter);
    default:
      return null;
  }
}

export function clearFaqCache(): void {
  replyCache.clear();
}
