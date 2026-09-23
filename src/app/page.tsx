import { getOpenPrograms } from "@/lib/open-programs";
import { getSiteContentDictionary } from "@/lib/public-data";
import HomeClient from "./HomeClient";

// 30 seconds revalidation to heavily cache queries and keep site extremely fast
export const revalidate = 30;

export default async function Page() {
  const [dictionary, openPrograms] = await Promise.all([
    getSiteContentDictionary("landing"),
    getOpenPrograms(6),
  ]);

  return <HomeClient content={dictionary} openPrograms={openPrograms} />;
}
