import { loadContentFiles } from "@/lib/content/collectMarkdown";
import { parseFrontmatter } from "@/lib/content/parseMarkdown";
import { suggestedQuestions } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export type FaqTopic = "projects" | "skills" | "contact";

const replyCache = new Map<string, string>();

function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function matchBySuggestion(message: string, locale: Locale): FaqTopic | null {
  const normalized = normalize(message);

  for (const question of suggestedQuestions) {
    if (normalize(question.label[locale]) === normalized) {
      return question.id as FaqTopic;
    }
  }

  return null;
}

function matchByPattern(message: string): FaqTopic | null {
  const normalized = normalize(message);

  if (
    /\b(contact|contacter|joindre|reach|email|mail|linkedin|github|ecrire|message)\b/.test(
      normalized,
    )
  ) {
    return "contact";
  }

  if (
    /\b(stack|competence|competences|skill|skills|technolog|expertise|outil|tools)\b/.test(
      normalized,
    )
  ) {
    return "skills";
  }

  if (
    /\b(projet|projets|project|projects|realis|portfolio|built|build|application)\b/.test(
      normalized,
    )
  ) {
    return "projects";
  }

  return null;
}

export function matchFaqTopic(message: string, locale: Locale): FaqTopic | null {
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
  const cacheKey = `${locale}:contact:v2`;
  const cached = replyCache.get(cacheKey);
  if (cached) return cached;

  const files = await loadLocaleFiles(locale);
  const about = files.find((file) => file.source.endsWith(`${locale}/about.md`));
  const { frontmatter } = parseFrontmatter(about?.raw ?? "");

  const email = frontmatter.email ?? "hello@augustinfachehoun.dev";
  const website = frontmatter.website ?? "https://augustinfachehoun.dev";
  const github = frontmatter.github ?? "https://github.com/AngeAugustin";
  const linkedin =
    frontmatter.linkedin ??
    "https://www.linkedin.com/in/augustinfachehoun/";
  const location = frontmatter.location ?? (locale === "fr" ? "Cotonou, Bénin" : "Cotonou, Benin");

  const reply =
    locale === "fr"
      ? `Vous pouvez contacter Augustin FACHEHOUN via :

- **Email** : ${formatEmailLink(email)}
- **Site web** : ${formatWebLink(website)}
- **LinkedIn** : ${formatWebLink(linkedin, "LinkedIn")}
- **GitHub** : ${formatWebLink(github, "GitHub")}
- **Localisation** : ${location}

Pour une opportunité professionnelle, l'email reste le canal le plus direct.`
      : `You can reach Augustin FACHEHOUN via:

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
      highlights.push(`**${title}** — ${skills.slice(0, 6).join(", ")}`);
    }
  }

  return highlights;
}

async function buildSkillsReply(locale: Locale): Promise<string> {
  const cacheKey = `${locale}:skills`;
  const cached = replyCache.get(cacheKey);
  if (cached) return cached;

  const files = await loadLocaleFiles(locale);
  const skillsFile = files.find((file) => file.source.endsWith(`${locale}/skills.md`));
  const { body } = parseFrontmatter(skillsFile?.raw ?? "");
  const highlights = extractStackHighlights(body, locale);

  const reply =
    locale === "fr"
      ? `Voici la stack principale d'Augustin :

${highlights.map((line) => `- ${line}`).join("\n")}

Il travaille aussi avec Docker, CI/CD, Vercel, PostgreSQL, MongoDB et des pipelines data (Airflow, dbt, ETL/ELT).`
      : `Here is Augustin's core stack:

${highlights.map((line) => `- ${line}`).join("\n")}

He also works with Docker, CI/CD, Vercel, PostgreSQL, MongoDB, and data pipelines (Airflow, dbt, ETL/ELT).`;

  replyCache.set(cacheKey, reply);
  return reply;
}

async function buildProjectsReply(locale: Locale): Promise<string> {
  const cacheKey = `${locale}:projects`;
  const cached = replyCache.get(cacheKey);
  if (cached) return cached;

  const files = await loadLocaleFiles(locale);
  const projects = files
    .filter((file) => file.source.includes(`${locale}/projects/`))
    .map((file) => {
      const { frontmatter } = parseFrontmatter(file.raw);
      return {
        title: frontmatter.title?.trim() ?? file.source.split("/").pop()?.replace(".md", "") ?? "Project",
        description: frontmatter.description?.trim() ?? "",
        year: frontmatter.year?.trim() ?? "",
        featured: frontmatter.featured === "true",
      };
    })
    .sort((a, b) => {
      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1;
      }

      return Number(b.year) - Number(a.year);
    });

  const lines = projects.map((project) => {
    const year = project.year ? ` (${project.year})` : "";
    const description = project.description ? ` — ${project.description}` : "";
    return `- **${project.title}**${year}${description}`;
  });

  const reply =
    locale === "fr"
      ? `Voici les principaux projets réalisés par Augustin :

${lines.join("\n")}

Chaque projet est documenté sur le portfolio avec stack, contexte et résultats.`
      : `Here are Augustin's main projects:

${lines.join("\n")}

Each project is documented on the portfolio with stack, context, and outcomes.`;

  replyCache.set(cacheKey, reply);
  return reply;
}

export async function getFaqReply(
  locale: Locale,
  message: string,
): Promise<string | null> {
  const topic = matchFaqTopic(message, locale);
  if (!topic) return null;

  switch (topic) {
    case "contact":
      return buildContactReply(locale);
    case "skills":
      return buildSkillsReply(locale);
    case "projects":
      return buildProjectsReply(locale);
    default:
      return null;
  }
}

export function clearFaqCache(): void {
  replyCache.clear();
}
