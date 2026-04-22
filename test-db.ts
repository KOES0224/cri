import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  console.log("startOfToday:", startOfToday);

  const all = await prisma.notification.findMany({
      where: { isRead: false }
  });
  console.log("--- All unread notifications ---");
  all.forEach(n => console.log(n.id, n.message, n.dueDate));

  const filtered = await prisma.notification.findMany({
    where: {
       isRead: false,
       dueDate: {
         gte: startOfToday
       }
    }
  });
  console.log("\n--- Filtered notifications (gte startOfToday) ---");
  filtered.forEach(n => console.log(n.id, n.message, n.dueDate));
}

main().catch(console.error).finally(() => prisma.$disconnect());
