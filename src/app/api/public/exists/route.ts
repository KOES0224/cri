import { NextResponse } from "next/server";
import { getPost, getProgramByRef, getSuccessStory } from "@/lib/public-data";
import { CURRENT_REF_HEADER } from "@/lib/missing-page";
import { programRef } from "@/lib/program-slug";

/**
 * 204 when the public page for `kind`/`id` would render, 404 when it would call notFound().
 * src/proxy.ts uses this so unknown URLs get a real 404 status before the page starts streaming.
 * Mirrors the checks in the page files; keep them in sync.
 *
 * A program asked for by its database id or by a slug it used to have also gets the CURRENT_REF_HEADER header with
 * the slug it answers on now, and the proxy redirects there.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const kind = params.get("kind");
  const id = params.get("id") ?? "";
  let found = false;
  let currentRef: string | null = null;
  if (id && id.length <= 200) {
    if (kind === "blog") found = Boolean(await getPost(id));
    else if (kind === "success") found = Boolean(await getSuccessStory(id));
    else if (kind === "program" || kind === "intern") {
      const program = await getProgramByRef(id);
      found = Boolean(program?.isPublished) && (kind === "program" || program?.category === "Internship");
      if (found && program && programRef(program) !== id) currentRef = programRef(program);
    }
  }
  return new NextResponse(null, {
    status: found ? 204 : 404,
    // Short edge cache: a page an admin just created may 404 for at most ~30 s if it was requested before it existed.
    headers: {
      // "Moved" answers are kept as briefly as "missing" ones, so a rename is followed quickly.
      "Cache-Control": found && !currentRef ? "public, s-maxage=60, stale-while-revalidate=600" : "public, s-maxage=30",
      ...(currentRef ? { [CURRENT_REF_HEADER]: currentRef } : {}),
    },
  });
}
