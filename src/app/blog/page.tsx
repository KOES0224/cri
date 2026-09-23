import BlogClientPage from "./BlogClientPage";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getPublishedPostCards } from "@/lib/public-data";
import { getDictionary, getLocale } from "@/i18n";

// Force dynamic rendering since we are fetching from DB
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLocale()).blog;
  return pageMetadata({ title: `${t.title} | CRI`, description: t.subtitle, path: "/blog" });
}

export default async function BlogPage() {
  return <BlogClientPage posts={await getPublishedPostCards()} />;
}
