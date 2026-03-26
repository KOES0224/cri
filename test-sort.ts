import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function test() {
  console.log("Testing findMany sorting...");
  try {
    const programs = await prisma.program.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
    console.log(`Success! Found ${programs.length} programs.`);
  } catch (e) {
    console.error("Error in findMany:", e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
