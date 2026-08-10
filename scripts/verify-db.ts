import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const counts = {
    projects: await prisma.project.count(),
    articles: await prisma.article.count(),
    services: await prisma.service.count(),
    admin: await prisma.adminUser.findFirst({ select: { email: true } }),
  };
  console.log("Postgres OK:", counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
