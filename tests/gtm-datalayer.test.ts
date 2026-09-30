import { test } from "node:test";
import assert from "node:assert/strict";

// GTM_ID is read when the module loads, so the environment and a production-host window are set up first.
process.env.NEXT_PUBLIC_GTM_ID = "GTM-TEST123";
const dataLayer: Record<string, unknown>[] = [];
(globalThis as unknown as { window: unknown }).window = { location: { hostname: "criglobal.org" }, dataLayer };

test("conversions reach the dataLayer with their transaction id and without values from earlier events", async () => {
  const { pushGtmEvent, FUNNEL_PARAMS } = await import("../src/lib/gtm");
  pushGtmEvent("program_view", { program_id: "prog-1", program_title: "Winter", accepting: true });
  pushGtmEvent("contact_submitted", { applicant_type: "parent", country: "KR", transaction_id: "lead-1" });
  pushGtmEvent("sign_up", { role: "STUDENT", method: "google" });

  const [view, contact, signUp] = dataLayer;
  assert.equal(view.event, "program_view");
  assert.equal(contact.transaction_id, "lead-1");
  // The inquiry did not come from a program page, so the program viewed before it is cleared, not inherited.
  assert.ok("program_id" in contact && contact.program_id === undefined);
  // A later event never carries the inquiry's transaction id.
  assert.ok("transaction_id" in signUp && signUp.transaction_id === undefined);
  for (const key of FUNNEL_PARAMS) assert.ok(key in signUp, key);
});

test("nothing is pushed off the production hostnames", async () => {
  const { pushGtmEvent } = await import("../src/lib/gtm");
  const before = dataLayer.length;
  (globalThis as unknown as { window: { location: { hostname: string } } }).window.location.hostname = "cri-portal-2024-git-x.vercel.app";
  pushGtmEvent("application_submitted", { transaction_id: "app-1" });
  assert.equal(dataLayer.length, before);
});
