import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123!", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin_agent@cri.kr" },
    update: {},
    create: {
      email: "admin_agent@cri.kr",
      name: "Agent Admin",
      password: password,
      role: "ADMIN",
    }
  });
  console.log("Admin created:", admin.email);
}

main().finally(() => prisma.$disconnect());
