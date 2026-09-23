/**
 * Submits every URL in the live sitemap to IndexNow (Bing, Naver, Yandex…). Run once after a deploy that adds or
 * moves many pages; day-to-day changes are pinged automatically by the admin actions (src/lib/indexnow.ts).
 *
 *   npx tsx scripts/indexnow-submit.ts            list the URLs, no request
 *   npx tsx scripts/indexnow-submit.ts --apply    submit them
 */
import { INDEXNOW_KEY, submitToIndexNow } from "../src/lib/indexnow";
import { SITE_URL } from "../src/lib/seo";

async function main() {
  const apply = process.argv.includes("--apply");

  // The key file must be live first, or the engines reject the submission.
  const keyFile = await fetch(`${SITE_URL}/${INDEXNOW_KEY}.txt`);
  if (!keyFile.ok || (await keyFile.text()).trim() !== INDEXNOW_KEY) {
    throw new Error(`${SITE_URL}/${INDEXNOW_KEY}.txt is not serving the key yet. Deploy first.`);
  }

  const sitemap = await (await fetch(`${SITE_URL}/sitemap.xml`)).text();
  const urls = [...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]))];
  console.log(`${urls.length} URLs in the sitemap`);
  if (!apply) {
    for (const url of urls) console.log(`  ${url}`);
    console.log("Preview only. Re-run with --apply to submit.");
    return;
  }

  const response = await submitToIndexNow(urls);
  console.log(`IndexNow responded ${response.status} ${response.statusText}`);
  if (!response.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
