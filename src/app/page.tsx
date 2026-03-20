import { prisma } from "@/lib/prisma";
import HomeClient from "./HomeClient";

// 30 seconds revalidation to heavily cache queries and keep site extremely fast
export const revalidate = 30;

export default async function Page() {
  const contents = await prisma.siteContent.findMany({
    where: { page: "landing" },
  });

  const dictionary = contents.reduce((acc: Record<string, string>, item: any) => {
    acc[item.key] = item.value;
    return acc;
  }, {});

  return <HomeClient content={dictionary} />;
}
