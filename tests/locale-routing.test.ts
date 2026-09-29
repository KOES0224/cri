import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hasKoreanContent,
  isLocalizablePath,
  localeAlternates,
  localizeHref,
  localizedPath,
  stripLocalePrefix,
  switchLocaleHref,
} from "../src/i18n/routing";

test("only public pages get a /ko URL", () => {
  for (const path of ["/", "/research", "/research/program/abc", "/blog/some-post", "/contact", "/partners"]) {
    assert.equal(isLocalizablePath(path), true, path);
  }
  for (const path of ["/dashboard", "/apply/start", "/auth/login", "/api/locale", "/onboarding", "/researcher", "/blogs"]) {
    assert.equal(isLocalizablePath(path), false, path);
  }
});

test("the /ko prefix is stripped only as a whole segment", () => {
  assert.deepEqual(stripLocalePrefix("/ko"), { locale: "ko", path: "/" });
  assert.deepEqual(stripLocalePrefix("/ko/research/winter"), { locale: "ko", path: "/research/winter" });
  assert.deepEqual(stripLocalePrefix("/korea"), { locale: null, path: "/korea" });
  assert.deepEqual(stripLocalePrefix("/research"), { locale: null, path: "/research" });
});

test("Korean links keep query and hash and leave portal and external links alone", () => {
  assert.equal(localizedPath("/", "ko"), "/ko");
  assert.equal(localizeHref("/research?kind=winter#open-programs", "ko"), "/ko/research?kind=winter#open-programs");
  assert.equal(localizeHref("/research#open-programs", "ko"), "/ko/research#open-programs");
  assert.equal(localizeHref("/ko/blog", "ko"), "/ko/blog");
  assert.equal(localizeHref("/apply/start?programId=1", "ko"), "/apply/start?programId=1");
  assert.equal(localizeHref("/dashboard", "ko"), "/dashboard");
  assert.equal(localizeHref("https://blog.naver.com/cri_official", "ko"), "https://blog.naver.com/cri_official");
  assert.equal(localizeHref("//cdn.example.com/x", "ko"), "//cdn.example.com/x");
  assert.equal(localizeHref("#faq", "ko"), "#faq");
  assert.equal(localizeHref("/research", "en"), "/research");
});

test("the language switch maps a page to its counterpart", () => {
  assert.equal(switchLocaleHref("/ko/research/winter?x=1", "en"), "/research/winter?x=1");
  assert.equal(switchLocaleHref("/ko", "en"), "/");
  assert.equal(switchLocaleHref("/", "ko"), "/ko");
  assert.equal(switchLocaleHref("/blog/post#top", "ko"), "/ko/blog/post#top");
});

test("hreflang is declared only where the page body is translated", () => {
  assert.deepEqual(localeAlternates("/research", "ko"), {
    canonical: "/ko/research",
    languages: { en: "/research", ko: "/ko/research", "x-default": "/research" },
  });
  assert.equal(localeAlternates("/", "en").canonical, "/");
  assert.equal(localeAlternates("/research/program/abc", "ko").canonical, "/ko/research/program/abc");
  // English-only articles and pages: the /ko copy points at the English canonical.
  assert.deepEqual(localeAlternates("/blog/some-post", "ko"), { canonical: "/blog/some-post" });
  assert.deepEqual(localeAlternates("/projects", "ko"), { canonical: "/projects" });
  assert.equal(hasKoreanContent("/research/program/abc/extra"), false);
});
