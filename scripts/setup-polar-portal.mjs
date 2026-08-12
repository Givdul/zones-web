import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Polar } from "@polar-sh/sdk";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const loadEnvFile = (filename) => {
  const path = resolve(root, filename);

  try {
    const contents = readFileSync(path, "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const equalsAt = trimmed.indexOf("=");
      if (equalsAt === -1) continue;

      const key = trimmed.slice(0, equalsAt).trim();
      const rawValue = trimmed.slice(equalsAt + 1).trim();
      if (!key || process.env[key]) continue;

      process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
};

loadEnvFile(".env");
loadEnvFile(".env.local");

const accessToken = process.env.POLAR_ACCESS_TOKEN;
if (!accessToken) {
  throw new Error("Missing POLAR_ACCESS_TOKEN. Put it in .env.local or export it before running this script.");
}

const siteOrigin = (process.env.PUBLIC_SITE_ORIGIN || "https://apps.givdul.com").replace(/\/$/, "");
const polarServer = process.env.POLAR_SERVER === "sandbox" ? "sandbox" : "production";
const polar = new Polar({ accessToken, server: polarServer });

const productMetadata = (plan) => ({
  givdul_app: "portal",
  givdul_plan: plan,
});

const plans = [
  {
    key: "license_799",
    envKey: "PUBLIC_POLAR_PORTAL_LICENSE_CHECKOUT_URL",
    name: "Portal One-Time License",
    label: "Portal - One-Time License",
    description: "One-time Portal license after a 3-day full-featured trial.",
    amount: 799,
    recurringInterval: null,
  },
];

const collectProducts = async () => {
  const products = [];
  const pages = await polar.products.list({
    query: "Portal",
    isArchived: false,
    limit: 100,
  });

  for await (const page of pages) {
    products.push(...(page.result?.items ?? []));
  }

  return products;
};

const collectCheckoutLinks = async (productId) => {
  const links = [];
  const pages = await polar.checkoutLinks.list({
    productId,
    limit: 100,
  });

  for await (const page of pages) {
    links.push(...(page.result?.items ?? []));
  }

  return links;
};

const findProduct = (products, plan) =>
  products.find((product) =>
    product.metadata?.givdul_app === "portal" &&
    product.metadata?.givdul_plan === plan.key &&
    product.name === plan.name
  );

const createProduct = (plan) => {
  const base = {
    name: plan.name,
    description: plan.description,
    visibility: "public",
    metadata: productMetadata(plan.key),
    prices: [
      {
        amountType: "fixed",
        priceCurrency: "usd",
        priceAmount: plan.amount,
      },
    ],
  };

  if (plan.recurringInterval) {
    return polar.products.create({
      ...base,
      recurringInterval: plan.recurringInterval,
      recurringIntervalCount: 1,
    });
  }

  return polar.products.create({
    ...base,
    recurringInterval: null,
    recurringIntervalCount: null,
  });
};

const findCheckoutLink = (links, plan) =>
  links.find((link) =>
    link.metadata?.givdul_app === "portal" &&
    link.metadata?.givdul_plan === plan.key &&
    link.label === plan.label
  );

const createCheckoutLink = (plan, product) =>
  polar.checkoutLinks.create({
    paymentProcessor: "stripe",
    products: [product.id],
    label: plan.label,
    allowDiscountCodes: true,
    requireBillingAddress: false,
    successUrl: `${siteOrigin}/frame?checkout_id={CHECKOUT_ID}`,
    returnUrl: `${siteOrigin}/frame`,
    metadata: productMetadata(plan.key),
  });

const products = await collectProducts();
const output = {
  server: polarServer,
  siteOrigin,
  createdAt: new Date().toISOString(),
  plans: {},
};

for (const plan of plans) {
  let product = findProduct(products, plan);
  let productCreated = false;

  if (!product) {
    product = await createProduct(plan);
    productCreated = true;
    products.push(product);
  }

  const links = await collectCheckoutLinks(product.id);
  let checkoutLink = findCheckoutLink(links, plan);
  let checkoutLinkCreated = false;

  if (!checkoutLink) {
    checkoutLink = await createCheckoutLink(plan, product);
    checkoutLinkCreated = true;
  }

  output.plans[plan.key] = {
    envKey: plan.envKey,
    productId: product.id,
    productName: product.name,
    productCreated,
    checkoutLinkId: checkoutLink.id,
    checkoutLinkCreated,
    checkoutUrl: checkoutLink.url,
  };
}

mkdirSync(resolve(root, ".polar"), { recursive: true });
writeFileSync(resolve(root, ".polar/portal-checkouts.json"), `${JSON.stringify(output, null, 2)}\n`);

const envLines = Object.values(output.plans).map((plan) => `${plan.envKey}=${plan.checkoutUrl}`);
writeFileSync(resolve(root, ".polar/portal-checkouts.env"), `${envLines.join("\n")}\n`);

console.log("Polar Portal setup complete.");
console.log("Wrote .polar/portal-checkouts.json and .polar/portal-checkouts.env.");
for (const [key, plan] of Object.entries(output.plans)) {
  const productState = plan.productCreated ? "created product" : "reused product";
  const linkState = plan.checkoutLinkCreated ? "created checkout link" : "reused checkout link";
  console.log(`${key}: ${productState}, ${linkState}`);
  console.log(`${plan.envKey}=${plan.checkoutUrl}`);
}
