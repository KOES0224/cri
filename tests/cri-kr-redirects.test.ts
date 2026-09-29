import { test } from "node:test";
import assert from "node:assert/strict";
import { CRI_KR_PAGES } from "../src/lib/cri-kr-redirects";
import { isLocalizablePath, stripLocalePrefix } from "../src/i18n/routing";

test("every old cri.kr page lands on a public criglobal.org page", () => {
  for (const [, destination] of CRI_KR_PAGES) {
    const { path } = stripLocalePrefix(destination);
    assert.ok(isLocalizablePath(path), destination);
  }
});

test("cri.kr sources are unique, rooted and without the WordPress trailing slash", () => {
  const sources = CRI_KR_PAGES.map(([source]) => source);
  assert.equal(new Set(sources).size, sources.length);
  for (const source of sources) {
    assert.ok(source.startsWith("/") && !source.endsWith("/"), source);
  }
});
