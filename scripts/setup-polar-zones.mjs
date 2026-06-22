import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
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
const downloadFilePath = process.env.POLAR_ZONES_DOWNLOAD_FILE
  ? resolve(root, process.env.POLAR_ZONES_DOWNLOAD_FILE)
  : resolve(root, ".polar/Zones.zip");

const metadata = {
  givdul_app: "zones",
  givdul_plan: "free_download",
  distribution: "polar_file_download",
};

const productConfig = {
  envKey: "PUBLIC_ZONES_DOWNLOAD_URL",
  benefitEnvKey: "POLAR_ZONES_DOWNLOAD_BENEFIT_ID",
  productEnvKey: "POLAR_ZONES_PRODUCT_ID",
  checkoutLinkEnvKey: "PUBLIC_POLAR_ZONES_DOWNLOAD_CHECKOUT_URL",
  name: "Zones",
  label: "Zones - Free Download",
  description: "Free macOS window zoning utility.",
  benefitDescription: "Download Zones for macOS",
};

const collectProducts = async () => {
  const products = [];
  const pages = await polar.products.list({
    query: productConfig.name,
    isArchived: false,
    limit: 100,
  });

  for await (const page of pages) {
    products.push(...(page.result?.items ?? []));
  }

  return products;
};

const collectBenefits = async () => {
  const benefits = [];
  const pages = await polar.benefits.list({
    query: productConfig.benefitDescription,
    typeFilter: "downloadables",
    limit: 100,
  });

  for await (const page of pages) {
    benefits.push(...(page.result?.items ?? []));
  }

  return benefits;
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

const findProduct = (products) =>
  products.find((product) =>
    product.metadata?.givdul_app === metadata.givdul_app &&
    product.metadata?.givdul_plan === metadata.givdul_plan &&
    product.name === productConfig.name
  );

const findBenefit = (benefits) =>
  benefits.find((benefit) =>
    benefit.metadata?.givdul_app === metadata.givdul_app &&
    benefit.metadata?.givdul_plan === metadata.givdul_plan &&
    benefit.type === "downloadables" &&
    benefit.description === productConfig.benefitDescription
  );

const findCheckoutLink = (links) =>
  links.find((link) =>
    link.metadata?.givdul_app === metadata.givdul_app &&
    link.metadata?.givdul_plan === metadata.givdul_plan &&
    link.label === productConfig.label
  );

const createProduct = () =>
  polar.products.create({
    name: productConfig.name,
    description: productConfig.description,
    visibility: "public",
    metadata,
    prices: [
      {
        amountType: "free",
      },
    ],
    recurringInterval: null,
    recurringIntervalCount: null,
  });

const createBenefit = () =>
  polar.benefits.create({
    type: "downloadables",
    description: productConfig.benefitDescription,
    metadata,
    properties: {
      files: [downloadableFile.id],
    },
  });

const sha256Base64 = (bytes) => createHash("sha256").update(bytes).digest("base64");

const uploadDownloadableFile = async () => {
  const bytes = readFileSync(downloadFilePath);
  const stats = statSync(downloadFilePath);
  const name = basename(downloadFilePath);
  const checksumSha256Base64 = sha256Base64(bytes);
  const uploadPart = {
    number: 1,
    chunkStart: 0,
    chunkEnd: stats.size,
    checksumSha256Base64,
  };

  const file = await polar.files.create({
    name,
    mimeType: "application/zip",
    size: stats.size,
    checksumSha256Base64,
    upload: {
      parts: [uploadPart],
    },
    service: "downloadable",
    version: process.env.POLAR_ZONES_DOWNLOAD_VERSION || null,
  });

  const part = file.upload.parts[0];
  const response = await fetch(part.url, {
    method: "PUT",
    headers: part.headers ?? {},
    body: bytes,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload ${name} to Polar storage: ${response.status} ${response.statusText}`);
  }

  const checksumEtag = response.headers.get("etag")?.replace(/^"|"$/g, "");
  if (!checksumEtag) {
    throw new Error(`Polar storage upload for ${name} did not return an ETag.`);
  }

  return polar.files.uploaded({
    id: file.id,
    fileUploadCompleted: {
      id: file.upload.id,
      path: file.upload.path,
      parts: [
        {
          number: part.number,
          checksumEtag,
          checksumSha256Base64,
        },
      ],
    },
  });
};

const createCheckoutLink = (product) =>
  polar.checkoutLinks.create({
    paymentProcessor: "stripe",
    products: [product.id],
    label: productConfig.label,
    allowDiscountCodes: false,
    requireBillingAddress: false,
    successUrl: `${siteOrigin}/zones?checkout_id={CHECKOUT_ID}`,
    returnUrl: `${siteOrigin}/zones`,
    metadata,
  });

const products = await collectProducts();
let product = findProduct(products);
let productCreated = false;

if (!product) {
  product = await createProduct();
  productCreated = true;
}

const benefits = await collectBenefits();
let benefit = findBenefit(benefits);
let benefitCreated = false;
let downloadableFile = null;
let downloadableSetupError = null;

if (!benefit) {
  try {
    downloadableFile = await uploadDownloadableFile();
    benefit = await createBenefit();
    benefitCreated = true;
  } catch (error) {
    downloadableSetupError = `${error.constructor?.name ?? "Error"}: ${error.message}`;
  }
}

const existingBenefitIds = product.benefits?.map((item) => item.id) ?? [];
let benefitAttached = benefit ? existingBenefitIds.includes(benefit.id) : false;

if (benefit && !benefitAttached) {
  product = await polar.products.updateBenefits({
    id: product.id,
    productBenefitsUpdate: {
      benefits: Array.from(new Set([...existingBenefitIds, benefit.id])),
    },
  });
  benefitAttached = true;
}

const links = await collectCheckoutLinks(product.id);
let checkoutLink = findCheckoutLink(links);
let checkoutLinkCreated = false;

if (!checkoutLink) {
  checkoutLink = await createCheckoutLink(product);
  checkoutLinkCreated = true;
}

const output = {
  server: polarServer,
  siteOrigin,
  createdAt: new Date().toISOString(),
  zones: {
    envKey: productConfig.envKey,
    checkoutLinkEnvKey: productConfig.checkoutLinkEnvKey,
    productEnvKey: productConfig.productEnvKey,
    benefitEnvKey: productConfig.benefitEnvKey,
    productId: product.id,
    productName: product.name,
    productCreated,
    benefitId: benefit?.id ?? null,
    benefitDescription: benefit?.description ?? null,
    benefitCreated,
    benefitAttached,
    downloadableSetupError,
    uploadedFileId: downloadableFile?.id ?? null,
    uploadedFileName: downloadableFile?.name ?? null,
    uploadedFileChecksumSha256Hex: downloadableFile?.checksumSha256Hex ?? null,
    checkoutLinkId: checkoutLink.id,
    checkoutLinkCreated,
    checkoutUrl: checkoutLink.url,
  },
};

mkdirSync(resolve(root, ".polar"), { recursive: true });
writeFileSync(resolve(root, ".polar/zones-checkout.json"), `${JSON.stringify(output, null, 2)}\n`);

const envLines = [
  `${productConfig.envKey}=${checkoutLink.url}`,
  `${productConfig.checkoutLinkEnvKey}=${checkoutLink.url}`,
  `${productConfig.productEnvKey}=${product.id}`,
];
if (benefit) {
  envLines.push(`${productConfig.benefitEnvKey}=${benefit.id}`);
}
writeFileSync(resolve(root, ".polar/zones-checkout.env"), `${envLines.join("\n")}\n`);

console.log("Polar Zones setup complete.");
console.log("Wrote .polar/zones-checkout.json and .polar/zones-checkout.env.");
console.log(`${productCreated ? "created product" : "reused product"}: ${product.id}`);
if (benefit) {
  console.log(`${benefitCreated ? "created benefit" : "reused benefit"}: ${benefit.id}`);
} else {
  console.log(`downloadable benefit pending: ${downloadableSetupError}`);
}
if (downloadableFile) {
  console.log(`uploaded file: ${downloadableFile.id}`);
  console.log(`sha256: ${downloadableFile.checksumSha256Hex}`);
}
console.log(`benefit ${benefitAttached ? "attached" : "not attached"}`);
console.log(`${checkoutLinkCreated ? "created checkout link" : "reused checkout link"}: ${checkoutLink.id}`);
console.log(`${productConfig.envKey}=${checkoutLink.url}`);
