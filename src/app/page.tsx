import { prisma } from "@/lib/prisma";
import { getOpenPrograms } from "@/lib/open-programs";
import { getMentorUniversities } from "@/lib/home-data";
import HomeClient from "./HomeClient";

// 30 seconds revalidation to heavily cache queries and keep site extremely fast
export const revalidate = 30;

export default async function Page() {
  const [contents, openPrograms, universities] = await Promise.all([
    prisma.siteContent.findMany({ where: { page: "landing" } }),
    getOpenPrograms(6),
    getMentorUniversities(12),
  ]);

  const dictionary = contents.reduce((acc: Record<string, string>, item: any) => {
    acc[item.key] = item.value;
    return acc;
  }, {});

  return <HomeClient content={dictionary} openPrograms={openPrograms} universities={universities} />;
}
