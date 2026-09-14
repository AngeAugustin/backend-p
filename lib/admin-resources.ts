export type FieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "number"
  | "checkbox"
  | "select"
  | "locale"
  | "publish"
  | "image";

export type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  rows?: number;
  help?: string;
  /** Shown as FR + EN side-by-side on bilingual create */
  localized?: boolean;
};

export type ResourceConfig = {
  key: string;
  label: string;
  singular: string;
  apiPath: string;
  titleField: string;
  subtitleField?: string;
  duplicable?: boolean;
  /** Create FR + EN rows in one form/submit */
  bilingualCreate?: boolean;
  /** Keep slug in sync with title until the user edits slug */
  autoSlugFromTitle?: boolean;
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
    duplicable: true,
    bilingualCreate: true,
    fields: [
      localeField,
      { name: "slug", label: "Slug", type: "text", required: true },
      {
        name: "title",
        label: "Titre",
        type: "text",
        required: true,
        localized: true,
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        required: true,
        rows: 3,
        localized: true,
      },
      {
        name: "caseStudy",
        label: "Contenu",
        type: "richtext",
        rows: 8,
        localized: true,
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
        localized: true,
      },
      { name: "imageUrl", label: "Image de couverture", type: "image" },
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
    duplicable: true,
    bilingualCreate: true,
    autoSlugFromTitle: true,
    fields: [
      localeField,
      {
        name: "title",
        label: "Titre",
        type: "text",
        required: true,
        localized: true,
      },
      {
        name: "slug",
        label: "Slug",
        type: "text",
        required: true,
        help: "Généré depuis le titre — tu peux le modifier.",
      },
      {
        name: "excerpt",
        label: "Excerpt",
        type: "textarea",
        required: true,
        rows: 3,
        localized: true,
      },
      {
        name: "content",
        label: "Contenu",
        type: "richtext",
        rows: 12,
        localized: true,
      },
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
      { name: "imageUrl", label: "Image de couverture", type: "image" },
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
    bilingualCreate: true,
    fields: [
      localeField,
      { name: "slug", label: "Slug", type: "text", required: true },
      {
        name: "title",
        label: "Titre",
        type: "text",
        required: true,
        localized: true,
      },
      {
        name: "summary",
        label: "Résumé",
        type: "textarea",
        required: true,
        rows: 3,
        localized: true,
      },
      {
        name: "tagline",
        label: "Tagline",
        type: "textarea",
        rows: 2,
        localized: true,
      },
      {
        name: "overview",
        label: "Overview",
        type: "textarea",
        rows: 6,
        localized: true,
      },
      { name: "order", label: "Ordre", type: "number" },
      {
        name: "tags",
        label: "Tags (une par ligne)",
        type: "textarea",
        rows: 3,
        localized: true,
      },
      {
        name: "deliverables",
        label: "Livrables (une par ligne)",
        type: "textarea",
        rows: 4,
        localized: true,
      },
      {
        name: "approach",
        label: "Approche (une par ligne)",
        type: "textarea",
        rows: 4,
        localized: true,
      },
      {
        name: "stack",
        label: "Stack (une par ligne)",
        type: "textarea",
        rows: 4,
        localized: true,
      },
      {
        name: "idealFor",
        label: "Idéal pour (une par ligne)",
        type: "textarea",
        rows: 4,
        localized: true,
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
    duplicable: true,
    bilingualCreate: true,
    fields: [
      localeField,
      { name: "key", label: "Clé", type: "text", required: true },
      {
        name: "role",
        label: "Rôle",
        type: "text",
        required: true,
        localized: true,
      },
      {
        name: "company",
        label: "Entreprise",
        type: "text",
        required: true,
        localized: true,
      },
      {
        name: "location",
        label: "Localisation",
        type: "text",
        localized: true,
      },
      {
        name: "period",
        label: "Période",
        type: "text",
        required: true,
        localized: true,
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        required: true,
        rows: 4,
        localized: true,
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
    bilingualCreate: true,
    fields: [
      localeField,
      { name: "key", label: "Clé", type: "text", required: true },
      {
        name: "quote",
        label: "Citation",
        type: "textarea",
        required: true,
        rows: 4,
        localized: true,
      },
      { name: "author", label: "Auteur", type: "text", required: true },
      {
        name: "role",
        label: "Rôle",
        type: "text",
        required: true,
        localized: true,
      },
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
    duplicable: true,
    bilingualCreate: true,
    fields: [
      localeField,
      { name: "key", label: "Clé", type: "text", required: true },
      {
        name: "degree",
        label: "Diplôme",
        type: "text",
        required: true,
        localized: true,
      },
      {
        name: "school",
        label: "École",
        type: "text",
        required: true,
        localized: true,
      },
      {
        name: "period",
        label: "Période",
        type: "text",
        required: true,
        localized: true,
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        required: true,
        rows: 4,
        localized: true,
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
      {
        name: "highlight",
        label: "Highlight",
        type: "text",
        localized: true,
      },
      { name: "order", label: "Ordre", type: "number" },
      publishField,
    ],
  },
];

export function getResource(key: string) {
  return resources.find((resource) => resource.key === key);
}
