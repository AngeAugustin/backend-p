import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const prisma = new PrismaClient();

async function main() {
  const data = {
    adminUsers: await prisma.adminUser.findMany(),
    projects: await prisma.project.findMany(),
    articles: await prisma.article.findMany(),
    services: await prisma.service.findMany(),
    experiences: await prisma.experience.findMany(),
    testimonials: await prisma.testimonial.findMany(),
    educations: await prisma.education.findMany(),
    contactMessages: await prisma.contactMessage.findMany(),
  };

  const out = resolve(process.cwd(), "prisma", "sqlite-export.json");
  writeFileSync(out, JSON.stringify(data, null, 2), "utf8");
  console.log(`Exported to ${out}`);
  console.log({
    adminUsers: data.adminUsers.length,
    projects: data.projects.length,
    articles: data.articles.length,
    services: data.services.length,
    experiences: data.experiences.length,
    testimonials: data.testimonials.length,
    educations: data.educations.length,
    contactMessages: data.contactMessages.length,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
