export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "checkbox"
  | "select"
  | "locale"
  | "publish";

export type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  rows?: number;
  help?: string;
};

export type ResourceConfig = {
  key: string;
  label: string;
  singular: string;
  apiPath: string;
  titleField: string;
  subtitleField?: string;
  fields: FieldConfig[];
};

const localeField: FieldConfig = {
  name: "locale",
  label: "Locale",
  type: "locale",
  required: true,
};

const publishField: FieldConfig = {
  name: "publish",
  label: "Publié",
  type: "publish",
};

export const resources: ResourceConfig[] = [
  {
    key: "projects",
    label: "Projets",
    singular: "Projet",
    apiPath: "/api/admin/projects",
    titleField: "title",
    subtitleField: "slug",
    fields: [
      localeField,
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "title", label: "Titre", type: "text", required: true },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        required: true,
        rows: 3,
      },
      {
        name: "caseStudy",
        label: "Case study",
        type: "textarea",
        rows: 8,
      },
      {
        name: "category",
        label: "Catégorie",
        type: "select",
        required: true,
        options: [
          { value: "web", label: "web" },
          { value: "ai", label: "ai" },
          { value: "api", label: "api" },
          { value: "dashboard", label: "dashboard" },
          { value: "saas", label: "saas" },
          { value: "automation", label: "automation" },
        ],
      },
      { name: "featured", label: "Mis en avant", type: "checkbox" },
      { name: "year", label: "Année", type: "text", required: true },
      {
        name: "stack",
        label: "Stack (une techno par ligne)",
        type: "textarea",
        rows: 4,
      },
      { name: "imageUrl", label: "Image URL", type: "text" },
      { name: "coverUrl", label: "Cover URL", type: "text" },
      { name: "liveUrl", label: "Live URL", type: "text" },
      { name: "repoUrl", label: "Repo URL", type: "text" },
      publishField,
    ],
  },
  {
    key: "articles",
    label: "Articles",
    singular: "Article",
    apiPath: "/api/admin/articles",
    titleField: "title",
    subtitleField: "slug",
    fields: [
      localeField,
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "title", label: "Titre", type: "text", required: true },
      {
        name: "excerpt",
        label: "Excerpt",
        type: "textarea",
        required: true,
        rows: 3,
      },
      { name: "content", label: "Contenu", type: "textarea", rows: 12 },
      {
        name: "category",
        label: "Catégorie",
        type: "select",
        required: true,
        options: [
          { value: "ai", label: "ai" },
          { value: "data", label: "data" },
          { value: "frontend", label: "frontend" },
        ],
      },
      { name: "featured", label: "Mis en avant", type: "checkbox" },
      { name: "readMinutes", label: "Minutes de lecture", type: "number" },
      { name: "date", label: "Date (YYYY-MM)", type: "text", required: true },
      { name: "imageUrl", label: "Image URL", type: "text" },
      { name: "coverUrl", label: "Cover URL", type: "text" },
      publishField,
    ],
  },
  {
    key: "services",
    label: "Services",
    singular: "Service",
    apiPath: "/api/admin/services",
    titleField: "title",
    subtitleField: "slug",
    fields: [
      localeField,
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "title", label: "Titre", type: "text", required: true },
      {
        name: "summary",
        label: "Résumé",
        type: "textarea",
        required: true,
        rows: 3,
      },
      { name: "tagline", label: "Tagline", type: "textarea", rows: 2 },
      { name: "overview", label: "Overview", type: "textarea", rows: 6 },
      { name: "order", label: "Ordre", type: "number" },
      { name: "tags", label: "Tags (une par ligne)", type: "textarea", rows: 3 },
      {
        name: "deliverables",
        label: "Livrables (une par ligne)",
        type: "textarea",
        rows: 4,
      },
      {
        name: "approach",
        label: "Approche (une par ligne)",
        type: "textarea",
        rows: 4,
      },
      {
        name: "stack",
        label: "Stack (une par ligne)",
        type: "textarea",
        rows: 4,
      },
      {
        name: "idealFor",
        label: "Idéal pour (une par ligne)",
        type: "textarea",
        rows: 4,
      },
      publishField,
    ],
  },
  {
    key: "experiences",
    label: "Expériences",
    singular: "Expérience",
    apiPath: "/api/admin/experiences",
    titleField: "role",
    subtitleField: "company",
    fields: [
      localeField,
      { name: "key", label: "Clé", type: "text", required: true },
      { name: "role", label: "Rôle", type: "text", required: true },
      { name: "company", label: "Entreprise", type: "text", required: true },
      { name: "period", label: "Période", type: "text", required: true },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        required: true,
        rows: 4,
      },
      { name: "order", label: "Ordre", type: "number" },
      publishField,
    ],
  },
  {
    key: "testimonials",
    label: "Témoignages",
    singular: "Témoignage",
    apiPath: "/api/admin/testimonials",
    titleField: "author",
    subtitleField: "role",
    fields: [
      localeField,
      { name: "key", label: "Clé", type: "text", required: true },
      { name: "quote", label: "Citation", type: "textarea", required: true, rows: 4 },
      { name: "author", label: "Auteur", type: "text", required: true },
      { name: "role", label: "Rôle", type: "text", required: true },
      { name: "order", label: "Ordre", type: "number" },
      publishField,
    ],
  },
  {
    key: "educations",
    label: "Formations",
    singular: "Formation",
    apiPath: "/api/admin/educations",
    titleField: "degree",
    subtitleField: "school",
    fields: [
      localeField,
      { name: "key", label: "Clé", type: "text", required: true },
      { name: "degree", label: "Diplôme", type: "text", required: true },
      { name: "school", label: "École", type: "text", required: true },
      { name: "period", label: "Période", type: "text", required: true },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        required: true,
        rows: 4,
      },
      {
        name: "status",
        label: "Statut",
        type: "select",
        required: true,
        options: [
          { value: "completed", label: "completed" },
          { value: "ongoing", label: "ongoing" },
        ],
      },
      { name: "highlight", label: "Highlight", type: "text" },
      { name: "order", label: "Ordre", type: "number" },
      publishField,
    ],
  },
];

export function getResource(key: string) {
  return resources.find((resource) => resource.key === key);
}
