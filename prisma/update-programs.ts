import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.program.updateMany({
    where: {
      subCategory: "Seoul Research Program"
    },
    data: {
      category: "seoul",
      tuition: 8580
    }
  });
  console.log(`Updated ${updated.count} programs to have category 'seoul' and tuition 8580.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
