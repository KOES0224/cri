const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const newPassword = "crikorea";
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const emails = [];
  for (let i = 1; i <= 5; i++) {
    emails.push(`student${i}@criglobal.org`);
    emails.push(`parent${i}@criglobal.org`);
  }

  const result = await prisma.user.updateMany({
    where: {
      email: {
        in: emails,
      },
    },
    data: {
      password: hashedPassword,
    },
  });

  console.log(`Successfully updated ${result.count} mock accounts passwords to '${newPassword}'`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
