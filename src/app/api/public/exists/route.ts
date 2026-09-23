import { NextResponse } from "next/server";
import { getPost, getProgramById, getSuccessStory } from "@/lib/public-data";

/**
 * 204 when the public page for `kind`/`id` would render, 404 when it would call notFound().
 * src/proxy.ts uses this so unknown URLs get a real 404 status before the page starts streaming.
 * Mirrors the checks in the page files; keep them in sync.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const kind = params.get("kind");
  const id = params.get("id") ?? "";
  let found = false;
  if (id && id.length <= 200) {
    if (kind === "blog") found = Boolean(await getPost(id));
    else if (kind === "success") found = Boolean(await getSuccessStory(id));
    else if (kind === "program" || kind === "intern") {
      const program = await getProgramById(id);
      found = Boolean(program?.isPublished) && (kind === "program" || program?.category === "Internship");
    }
  }
  return new NextResponse(null, {
    status: found ? 204 : 404,
    // Short edge cache: a page an admin just created may 404 for at most ~30 s if it was requested before it existed.
    headers: { "Cache-Control": found ? "public, s-maxage=60, stale-while-revalidate=600" : "public, s-maxage=30" },
  });
}
