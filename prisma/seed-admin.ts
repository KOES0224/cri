import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@cri.kr";
  // The temporary password is provided here but will be hashed securely.
  const plainPassword = "adminmasterpassword2026!";
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: "ADMIN",
      name: "Master Admin",
    },
    create: {
      email,
      name: "Master Admin",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("Master Admin user created/updated successfully:", admin.email);
  console.log("Your temporary password is:", plainPassword);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
