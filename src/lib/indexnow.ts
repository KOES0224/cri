import { after } from "next/server";
import { SITE_URL } from "@/lib/seo";
import { hasKoreanContent, localizedPath } from "@/i18n/routing";

/**
 * IndexNow (https://www.indexnow.org) tells Bing, Naver, Yandex and other participating engines that a page
 * changed, so new programs and articles are recrawled within minutes instead of weeks. Bing's index also feeds
 * ChatGPT search. The key is public by design: it is served at /<key>.txt to prove ownership of the host.
 */
export const INDEXNOW_KEY = "0a0f58f1c25fcf2ae5ede06ed1d7c93e";
const ENDPOINT = "https://api.indexnow.org/indexnow";

/** Absolute URLs for the given public paths, adding the /ko URL for pages with Korean content. */
export function indexNowUrls(paths: string[]): string[] {
  const expanded = paths.flatMap((path) => (hasKoreanContent(path) ? [path, localizedPath(path, "ko")] : [path]));
  return [...new Set(expanded)].map((path) => `${SITE_URL}${path}`);
}

export async function submitToIndexNow(urls: string[]): Promise<Response> {
  return fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: new URL(SITE_URL).host,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    }),
  });
}

/**
 * Pings IndexNow after the admin response is sent. Production deployments only; failures are logged, never thrown.
 * Call it from server actions that publish or change public pages.
 */
export function notifySearchEngines(paths: string[]) {
  if (process.env.VERCEL_ENV !== "production" || paths.length === 0) return;
  const urls = indexNowUrls(paths);
  after(async () => {
    try {
      const response = await submitToIndexNow(urls);
      if (!response.ok) console.error(`[indexnow] ${response.status} for ${urls.length} URLs`);
    } catch (error) {
      console.error("[indexnow] request failed:", error);
    }
  });
}
