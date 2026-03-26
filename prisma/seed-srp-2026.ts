import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const srpPrograms = [
  {
    title: "Harvard Biomedical Science Core",
    description: "Harvard biomedical faculty, Neural & life sciences expert, Harvard lab research mentorship",
    category: "Research",
    subCategory: "Seoul Research Program",
    status: "OPEN"
  },
  {
    title: "Northwestern Medicine",
    description: "Medicine & computer science expert, ACM IMWUT Best Paper Award, IEEE PerCom Best Paper Award",
    category: "Research",
    subCategory: "Seoul Research Program",
    status: "OPEN"
  },
  {
    title: "Caltech Organic Chemistry",
    description: "Top 1% chemist worldwide, Nobel Prize academic lineage, Feynman Prize in Chemistry",
    category: "Research",
    subCategory: "Seoul Research Program",
    status: "OPEN"
  },
  {
    title: "UChicago Computer Science",
    description: "Computational economics expert, AI & machine learning specialist, Google Research scholar",
    category: "Research",
    subCategory: "Seoul Research Program",
    status: "OPEN"
  },
  {
    title: "Columbia Applied Mathematics",
    description: "NASA quantitative analysis, Market & policy forecasting models, Advanced quantitative analysis",
    category: "Research",
    subCategory: "Seoul Research Program",
    status: "OPEN"
  },
  {
    title: "Columbia Applied Physics",
    description: "NASA climate scientist, Atmospheric & climate physics, Quantitative climate modeling",
    category: "Research",
    subCategory: "Seoul Research Program",
    status: "OPEN"
  },
  {
    title: "MIT Business",
    description: "Market-validated research, Silicon Valley entrepreneur, MIT Sloan MBA faculty",
    category: "Research",
    subCategory: "Seoul Research Program",
    status: "OPEN"
  },
  {
    title: "UChicago Economy",
    description: "Micro & game theory specialist, Behavioral decision theory, Admissions committee",
    category: "Research",
    subCategory: "Seoul Research Program",
    status: "OPEN"
  },
  {
    title: "Cambridge Finance",
    description: "Empirical finance & asset pricing, Data-driven market forecasting, Cambridge finance faculty",
    category: "Research",
    subCategory: "Seoul Research Program",
    status: "OPEN"
  },
  {
    title: "UPenn International Law",
    description: "Environmental policy, Obama administration legal advisor, ICC U.S. representative",
    category: "Research",
    subCategory: "Seoul Research Program",
    status: "OPEN"
  },
  {
    title: "Oxford Education",
    description: "Child language & literacy development, Bilingual education specialist, Education policy advisor",
    category: "Research",
    subCategory: "Seoul Research Program",
    status: "OPEN"
  },
  {
    title: "Oxford Psychology",
    description: "Biology-based psychology, Emotion–behavior research, Experimental psychology leader",
    category: "Research",
    subCategory: "Seoul Research Program",
    status: "OPEN"
  },
  {
    title: "USC Film",
    description: "America's #1 film school faculty, Film production & directing, Broadway & film director",
    category: "Research",
    subCategory: "Seoul Research Program",
    status: "OPEN"
  },
  {
    title: "RISD Architecture",
    description: "Design & Urban Studies, MIT & Princeton trained, Founder of Aggregate",
    category: "Research",
    subCategory: "Seoul Research Program",
    status: "OPEN"
  }
];

async function main() {
  console.log("Seeding SRP 2026 Programs...");

  for (const p of srpPrograms) {
    const program = await prisma.program.create({
      data: p
    });
    console.log(`Created: ${program.title}`);
  }

  console.log("SRP 2026 Programs Seeding Complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
