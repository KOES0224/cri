import { test } from "node:test";
import assert from "node:assert/strict";
import { MOVE_RESET_TOKEN, RESET_TOKEN_KEY } from "../src/lib/reset-token";

/** Runs the early script against a fake page address; returns the cleaned address and what was stored. */
function run(href: string) {
  const stored: Record<string, string> = {};
  let address: string | null = null;
  const page = {
    location: { href, pathname: new URL(href).pathname },
    sessionStorage: { setItem: (key: string, value: string) => { stored[key] = value; } },
    history: { replaceState: (_state: unknown, _title: string, url: string) => { address = url; } },
    URL, URLSearchParams,
  };
  new Function(...Object.keys(page), MOVE_RESET_TOKEN)(...Object.values(page));
  return { address, token: stored[RESET_TOKEN_KEY] ?? null };
}

test("the reset token leaves the address before any script can report it", () => {
  assert.deepEqual(run("https://criglobal.org/auth/recovery#token=abc123"), { address: "/auth/recovery", token: "abc123" });
  // Links sent before the fragment format keep working, and other query parameters stay.
  assert.deepEqual(run("https://criglobal.org/auth/recovery?token=abc123&utm_source=mail"), { address: "/auth/recovery?utm_source=mail", token: "abc123" });
});

test("other pages and token-less visits are left alone", () => {
  assert.deepEqual(run("https://criglobal.org/blog?token=abc123"), { address: null, token: null });
  assert.deepEqual(run("https://criglobal.org/auth/recovery"), { address: null, token: null });
});
