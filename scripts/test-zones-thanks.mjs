import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const page = readFileSync(new URL("../src/pages/zones/thanks.astro", import.meta.url), "utf8");
const script = ts.transpile(page.match(/<script>([\s\S]*?)<\/script>/)[1], { target: ts.ScriptTarget.ES2022 });
const benefit = "60294014-3e28-4230-a74c-f945940e59f4";
const downloadable = (url = "https://files.example/Zones-1.0.zip") => ({ benefit_id: benefit, file: { name: "Zones-1.0.zip", download: { url } } });

async function render({ token = "polar_cst_test", downloads = [downloadable()], licenses = [], fail = "", licenseBenefit = "zones-license" } = {}) {
  const nodes = new Map();
  for (const name of ["download-status", "downloads", "license-keys"]) {
    nodes.set(`[data-${name}]`, { textContent: "", children: [], append(child) { this.children.push(child); }, get childElementCount() { return this.children.length; } });
  }
  const calls = [];
  let cleanedUrl;
  const root = { dataset: { downloadBenefitId: benefit, licenseBenefitId: licenseBenefit }, querySelector: (selector) => nodes.get(selector) };
  const location = `https://apps.givdul.com/zones/thanks?checkout_id=test${token ? `&customer_session_token=${token}` : ""}#receipt`;
  runInNewContext(script, {
    URL, AbortSignal,
    window: { location: { href: location }, history: { state: { retained: true }, replaceState(state, title, url) { assert.equal(title, ""); assert.equal(state.retained, true); cleanedUrl = url; } } },
    document: { querySelector: () => root, createElement: (tag) => ({ tag }) },
    fetch: async (url, options) => {
      assert.ok(!cleanedUrl.includes("customer_session_token"), "token must be removed before fetching");
      calls.push({ url, options });
      const kind = url.pathname.includes("downloadables") ? "downloadables" : "license-keys";
      if (fail === "network") throw new Error("offline");
      return { ok: fail !== kind, json: async () => ({ items: kind === "downloadables" ? downloads : licenses }) };
    },
  });
  await new Promise((resolve) => setImmediate(resolve));
  return { nodes, calls, cleanedUrl };
}

test("checkout page is private, has a referrer policy and no-JS portal fallback", () => {
  assert.match(page, /robots="noindex,nofollow"/);
  assert.match(page, /name="referrer" content="no-referrer"/);
  assert.match(page, /<noscript>/);
  assert.match(page, /https:\/\/polar.sh\/hansen-software\/portal/);
});

test("new customer gets a Polar download and scoped license without retaining the token", async () => {
  const { nodes, calls, cleanedUrl } = await render({ licenses: [{ benefit_id: "zones-license", key: "KEY-123", status: "granted" }] });
  assert.equal(cleanedUrl, "/zones/thanks?checkout_id=test#receipt");
  const link = nodes.get("[data-downloads]").children[0];
  assert.equal(link.href, "https://files.example/Zones-1.0.zip");
  assert.equal(link.download, "Zones-1.0.zip");
  assert.equal(link.textContent, "Download Zones-1.0.zip");
  assert.equal(nodes.get("[data-license-keys]").children[0].textContent, "KEY-123");
  assert.equal(calls.length, 2);
  for (const { url, options } of calls) {
    assert.equal(url.origin, "https://api.polar.sh");
    assert.ok(url.searchParams.has("benefit_id"));
    assert.equal(options.headers.Authorization, "Bearer polar_cst_test");
    assert.equal(options.referrerPolicy, "no-referrer");
    assert.equal(options.cache, "no-store");
  }
});

test("returning customer with checkout_id only makes no authenticated request", async () => {
  const { calls, nodes } = await render({ token: "" });
  assert.equal(calls.length, 0);
  assert.equal(nodes.get("[data-downloads]").childElementCount, 0);
});

for (const fail of ["downloadables", "network"]) {
  test(`${fail} failure leaves email/portal guidance`, async () => {
    const { nodes } = await render({ fail });
    assert.match(nodes.get("[data-download-status]").textContent, /confirmation email or open your Polar portal/);
  });
}

test("empty or pending benefits produce usable fallback", async () => {
  const { nodes } = await render({ downloads: [] });
  assert.match(nodes.get("[data-download-status]").textContent, /not ready yet/);
});

test("license failure does not hide download; download failure does not hide license", async () => {
  const first = await render({ fail: "license-keys" });
  assert.equal(first.nodes.get("[data-downloads]").childElementCount, 1);
  const second = await render({ fail: "downloadables", licenses: [{ benefit_id: "zones-license", status: "granted", key: "KEY" }] });
  assert.equal(second.nodes.get("[data-license-keys]").childElementCount, 1);
});

test("unsafe URLs and unrelated or revoked benefits are not displayed", async () => {
  const { nodes } = await render({
    downloads: [downloadable("javascript:alert(1)"), downloadable("http://files.example/a.zip"), { ...downloadable(), benefit_id: "another-product" }],
    licenses: [{ benefit_id: "other", status: "granted", key: "OTHER" }, { benefit_id: "zones-license", status: "revoked", key: "REVOKED" }],
  });
  assert.equal(nodes.get("[data-downloads]").childElementCount, 0);
  assert.equal(nodes.get("[data-license-keys]").childElementCount, 0);
});

test("missing license configuration uses portal instead of unscoped API", async () => {
  const { calls } = await render({ licenseBenefit: "" });
  assert.equal(calls.length, 1);
  assert.match(calls[0].url.pathname, /downloadables/);
});

test("setup targets thanks for new and existing checkout links and publishes benefit ID", () => {
  const setup = readFileSync(new URL("./setup-polar-zones.mjs", import.meta.url), "utf8");
  assert.match(setup, /\/zones\/thanks\?checkout_id=\{CHECKOUT_ID\}/);
  assert.match(setup, /checkoutLinks\.update\(/);
  assert.match(setup, /checkoutLinks\.get\(/);
  assert.match(setup, /PUBLIC_POLAR_ZONES_DOWNLOAD_BENEFIT_ID=/);
});
