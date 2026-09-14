import "dotenv/config";
import { chromium, type Page } from "playwright";
import { prisma } from "../lib/prisma";

const BASE = process.env.TEST_API_BASE || "http://localhost:1337";
const EMAIL = process.env.ADMIN_EMAIL || "admin@portfolio.local";
const PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function fillLocalized(
  page: Page,
  legend: string,
  fr: string,
  en: string
) {
  const fieldset = page.locator("fieldset").filter({ hasText: legend }).first();
  await fieldset.getByText("Français", { exact: true }).locator("..").locator("input, textarea").fill(fr);
  await fieldset.getByText("English", { exact: true }).locator("..").locator("input, textarea").fill(en);
}

async function fillSharedText(page: Page, label: string, value: string) {
  const field = page.locator("label").filter({ hasText: label }).first();
  await field.locator("input, textarea").fill(value);
}

async function login(page: Page) {
  await page.goto(`${BASE}/admin/login`);
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Mot de passe").fill(PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL((url) => {
    const path = url.pathname;
    return path.startsWith("/admin") && !path.includes("/login");
  }, { timeout: 15000 });
}

async function testProjectUiCreate() {
  const stamp = Date.now();
  const slug = `ui-proj-${stamp}`;
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();

  try {
    await login(page);

    await page.goto(`${BASE}/admin/projects/new`);
    await page.waitForURL("**/admin/projects/new");
    await page.getByRole("heading", { name: "Nouveau Projet" }).waitFor({
      timeout: 15000,
    });
    await page.getByText("Création bilingue", { exact: false }).waitFor({
      timeout: 10000,
    });

    assert(
      await page.getByRole("button", { name: "Créer FR + EN" }).isVisible(),
      "missing Créer FR + EN button"
    );
    assert(
      await page.getByText("Français").first().isVisible(),
      "missing Français column"
    );
    assert(
      await page.getByText("English").first().isVisible(),
      "missing English column"
    );

    await fillSharedText(page, "Slug", slug);
    await fillSharedText(page, "Année", "2026");
    await fillLocalized(page, "Titre", "Projet UI FR", "UI Project EN");
    await fillLocalized(
      page,
      "Description",
      "Description française du test UI",
      "English description for UI test"
    );
    await fillLocalized(page, "Case study", "Case FR", "Case EN");
    await fillLocalized(page, "Stack (une techno par ligne)", "React\nNext", "React\nNext");

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes("/api/admin/projects") &&
          res.request().method() === "POST"
      ),
      page.getByRole("button", { name: "Créer FR + EN" }).click(),
    ]);

    assert(response.status() === 201, `POST status ${response.status()}`);
    const body = (await response.json()) as { data?: unknown[] };
    assert(Array.isArray(body.data) && body.data.length === 2, "API did not return 2 rows");

    await page.waitForURL(/\/admin\/projects\/?$/, { timeout: 15000 });

    const rows = await prisma.project.findMany({
      where: { slug },
      orderBy: { locale: "asc" },
    });
    assert(rows.length === 2, `expected 2 DB rows, got ${rows.length}`);
    assert(
      rows.some((row) => row.locale === "fr" && row.title === "Projet UI FR"),
      "FR row missing/wrong"
    );
    assert(
      rows.some((row) => row.locale === "en" && row.title === "UI Project EN"),
      "EN row missing/wrong"
    );

    // list page should show both (or at least the titles depending on locale filter)
    await page.selectOption("select", "all").catch(() => undefined);
    await page.waitForTimeout(500);
    const content = await page.content();
    assert(
      content.includes("Projet UI FR") || content.includes("UI Project EN"),
      "created project not visible in list"
    );

    console.log("✓ UI project bilingual create");
  } finally {
    await prisma.project.deleteMany({ where: { slug } });
    await browser.close();
  }
}

async function testArticleUiCreate() {
  const stamp = Date.now();
  const slugFr = `ui-art-fr-${stamp}`;
  const slugEn = `ui-art-en-${stamp}`;
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();

  try {
    await login(page);
    await page.goto(`${BASE}/admin/articles/new`);
    await page.waitForURL("**/admin/articles/new");
    await page.getByRole("heading", { name: "Nouveau Article" }).waitFor({
      timeout: 15000,
    });
    await page.getByText("Création bilingue", { exact: false }).waitFor({
      timeout: 10000,
    });

    await fillSharedText(page, "Date (YYYY-MM)", "2026-09");
    await fillLocalized(page, "Titre", "Article UI FR", "UI Article EN");
    await fillLocalized(page, "Slug", slugFr, slugEn);
    await fillLocalized(page, "Excerpt", "Extrait FR", "Excerpt EN");
    await fillLocalized(page, "Contenu", "Contenu FR", "Content EN");

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes("/api/admin/articles") &&
          res.request().method() === "POST"
      ),
      page.getByRole("button", { name: "Créer FR + EN" }).click(),
    ]);

    assert(response.status() === 201, `articles POST ${response.status()}`);
    const body = (await response.json()) as { data?: unknown[] };
    assert(Array.isArray(body.data) && body.data.length === 2, "articles != 2");

    await page.waitForURL(/\/admin\/articles\/?$/, { timeout: 15000 });

    const rows = await prisma.article.findMany({
      where: { slug: { in: [slugFr, slugEn] } },
    });
    assert(rows.length === 2, `articles DB count ${rows.length}`);
    assert(
      rows.some((row) => row.locale === "fr" && row.slug === slugFr),
      "FR slug missing/wrong"
    );
    assert(
      rows.some((row) => row.locale === "en" && row.slug === slugEn),
      "EN slug missing/wrong"
    );
    console.log("✓ UI article bilingual create");
  } finally {
    await prisma.article.deleteMany({
      where: { slug: { in: [slugFr, slugEn] } },
    });
    await browser.close();
  }
}

async function testServiceUiCreate() {
  const stamp = Date.now();
  const slug = `ui-svc-${stamp}`;
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();

  try {
    await login(page);
    await page.goto(`${BASE}/admin/services/new`);
    await page.waitForURL("**/admin/services/new");
    await page.getByRole("heading", { name: "Nouveau Service" }).waitFor({
      timeout: 15000,
    });

    await fillSharedText(page, "Slug", slug);
    await fillLocalized(page, "Titre", "Service UI FR", "UI Service EN");
    await fillLocalized(page, "Résumé", "Résumé FR", "Summary EN");

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes("/api/admin/services") &&
          res.request().method() === "POST"
      ),
      page.getByRole("button", { name: "Créer FR + EN" }).click(),
    ]);

    assert(response.status() === 201, `services POST ${response.status()}`);
    const body = (await response.json()) as { data?: unknown[] };
    assert(Array.isArray(body.data) && body.data.length === 2, "services != 2");

    await page.waitForURL(/\/admin\/services\/?$/, { timeout: 15000 });
    const rows = await prisma.service.findMany({ where: { slug } });
    assert(rows.length === 2, `services DB count ${rows.length}`);
    console.log("✓ UI service bilingual create");
  } finally {
    await prisma.service.deleteMany({ where: { slug } });
    await browser.close();
  }
}

async function main() {
  console.log("UI E2E bilingual…");
  await testProjectUiCreate();
  await testArticleUiCreate();
  await testServiceUiCreate();
  console.log("\nUI_ALL_OK");
}

main()
  .catch((error) => {
    console.error("\nUI_FAIL", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
