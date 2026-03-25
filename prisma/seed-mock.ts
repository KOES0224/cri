import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding 5 Test Students...");
  for (let i = 1; i <= 5; i++) {
     const studentPrefix = `student${i}`;
     const studentEmail = `${studentPrefix}@criglobal.org`;
     const password = await bcrypt.hash(studentPrefix, 10);

     await prisma.user.upsert({
       where: { email: studentEmail },
       update: {},
       create: {
         email: studentEmail,
         name: `Test Student ${i}`,
         password,
         role: "STUDENT",
         studentCode: `STU${1000 + i}`,
       }
     });
     console.log(`Created: ${studentEmail} | Password: ${studentPrefix}`);
  }
  
  console.log("\nSeeding 5 Test Parents...");
  for (let i = 1; i <= 5; i++) {
     const parentPrefix = `parent${i}`;
     const parentEmail = `${parentPrefix}@criglobal.org`;
     const password = await bcrypt.hash(parentPrefix, 10);

     await prisma.user.upsert({
       where: { email: parentEmail },
       update: {},
       create: {
         email: parentEmail,
         name: `Test Parent ${i}`,
         password,
         role: "PARENT",
         isAgency: false
       }
     });
     console.log(`Created: ${parentEmail} | Password: ${parentPrefix}`);
  }
  console.log("\nSeeding complete! You can use these accounts to safely test without touching live data.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
