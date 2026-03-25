import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Mock Programs...");

  // 1. Create Programs
  const research = await prisma.program.create({
    data: {
      title: "Advanced Cognitive Psychology Research",
      description: "1-on-1 Mentorship program focused on cognitive behavioral algorithms.",
      category: "Research",
      subCategory: "1-on-1",
      status: "OPEN"
    }
  });

  const project = await prisma.program.create({
    data: {
      title: "Sustainable Urban Design Project",
      description: "Group project integrating AI with modern urban infrastructure.",
      category: "Projects",
      subCategory: "Group",
      status: "OPEN"
    }
  });

  const intern = await prisma.program.create({
    data: {
      title: "Global FinTech Internship",
      description: "Remote internship at a leading financial technology firm.",
      category: "Internship",
      status: "OPEN"
    }
  });

  console.log("Mock Programs created.");

  // 2. Fetch Mock Students
  const students = await prisma.user.findMany({
    where: {
      email: {
        in: [
          "student1@criglobal.org",
          "student2@criglobal.org",
          "student3@criglobal.org",
          "student4@criglobal.org",
          "student5@criglobal.org"
        ]
      }
    }
  });

  const getStudent = (email: string) => students.find(s => s.email === email);

  console.log("Enrolling Students...");

  // student1: Research & Internship
  if (getStudent("student1@criglobal.org")) {
    await prisma.enrollment.create({ data: { userId: getStudent("student1@criglobal.org")!.id, programId: research.id, status: "ONGOING" } });
    await prisma.enrollment.create({ data: { userId: getStudent("student1@criglobal.org")!.id, programId: intern.id, status: "ONGOING" } });
  }

  // student2: Research & Project
  if (getStudent("student2@criglobal.org")) {
    await prisma.enrollment.create({ data: { userId: getStudent("student2@criglobal.org")!.id, programId: research.id, status: "ONGOING" } });
    await prisma.enrollment.create({ data: { userId: getStudent("student2@criglobal.org")!.id, programId: project.id, status: "ONGOING" } });
  }

  // student3: Internship & Project
  if (getStudent("student3@criglobal.org")) {
    await prisma.enrollment.create({ data: { userId: getStudent("student3@criglobal.org")!.id, programId: intern.id, status: "ONGOING" } });
    await prisma.enrollment.create({ data: { userId: getStudent("student3@criglobal.org")!.id, programId: project.id, status: "ONGOING" } });
  }

  // student4: All three
  if (getStudent("student4@criglobal.org")) {
    await prisma.enrollment.create({ data: { userId: getStudent("student4@criglobal.org")!.id, programId: research.id, status: "ONGOING" } });
    await prisma.enrollment.create({ data: { userId: getStudent("student4@criglobal.org")!.id, programId: project.id, status: "ONGOING" } });
    await prisma.enrollment.create({ data: { userId: getStudent("student4@criglobal.org")!.id, programId: intern.id, status: "ONGOING" } });
  }

  // student5: ZERO enrollments (To test the locked portal gate)
  
  console.log("Enrollment Seeding Complete! Student5 is intentionally locked out.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
