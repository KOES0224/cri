import { test } from "node:test";
import assert from "node:assert/strict";
import { gtmEnabled, parseGtmId } from "../src/lib/gtm";

test("GTM container id is normalized and anything else switches GTM off", () => {
  assert.equal(parseGtmId(" gtm-abc123 "), "GTM-ABC123");
  assert.equal(parseGtmId("G-3P62YMEM56"), ""); // a GA4 id pasted by mistake
  assert.equal(parseGtmId("<script>"), "");
  assert.equal(parseGtmId(undefined), "");
  assert.equal(gtmEnabled(), false); // never on the server
});
