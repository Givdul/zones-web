const fallbackSiteOrigin = "https://apps.givdul.com";
const configuredSiteOrigin = import.meta.env.PUBLIC_SITE_ORIGIN?.trim();

const resolveUrl = (value: string, fallback: string) => {
  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    return fallback;
  }
};

const resolveAppStoreUrl = (value?: string) => {
  if (!value || !value.startsWith("https://apps.apple.com/")) {
    return null;
  }

  return value;
};

const siteOrigin = configuredSiteOrigin
  ? resolveUrl(configuredSiteOrigin, fallbackSiteOrigin)
  : fallbackSiteOrigin;

const appStoreUrls = {
  portal: resolveAppStoreUrl(import.meta.env.PUBLIC_PORTAL_APP_STORE_URL?.trim()),
} as const;

const downloadUrls = {
  zones: import.meta.env.PUBLIC_ZONES_DOWNLOAD_URL?.trim() || null,
  portal: import.meta.env.PUBLIC_PORTAL_DOWNLOAD_URL?.trim() || null,
  atoll: import.meta.env.PUBLIC_ATOLL_DOWNLOAD_URL?.trim() || null,
} as const;

const checkoutUrls = {
  portalLicense: import.meta.env.PUBLIC_POLAR_PORTAL_LICENSE_CHECKOUT_URL?.trim() || null,
} as const;

export interface AppProofPoint {
  title: string;
  copy: string;
  icon: "window" | "gesture" | "star";
}

export interface AppPricingTier {
  name: string;
  label: string;
  title: string;
  price: string;
  note: string;
  lead: string;
  items: string[];
  cta: string;
  ctaUrl?: string | null;
  /** Optional visual emphasis on the pricing card (e.g. recommended paid tier). */
  emphasis?: "recommended";
}

export interface AppPrivacySection {
  title: string;
  paragraphs: string[];
}

export interface AppWorkflowStep {
  kind: "action" | "key";
  label: string;
  icon?: "plus" | "window";
}

export interface AppRecord {
  slug: string;
  status: "live";
  name: string;
  productLabel: string;
  iconPath?: string;
  landingPath: string;
  supportPath: string;
  privacyPath: string;
  appStoreUrl: string | null;
  appStoreId: string | null;
  hasAppStoreUrl: boolean;
  downloadUrl: string | null;
  hasDownloadUrl: boolean;
  title: string;
  tagline: string;
  description: string;
  cardSummary: string;
  supportSummary: string;
  privacySummary: string;
  heroTitle: string;
  heroTagline: string;
  heroLede: string;
  heroVisualLabel: string;
  workflowSteps: AppWorkflowStep[];
  proofPoints: AppProofPoint[];
  /** Optional section headline above pricing cards (avoids reusing first card titles). */
  pricingIntro?: { headline: string; subheadline: string };
  /**
   * `freemium`: first tier reads as a permanent free base; later tiers use “+” list markers.
   * `trial_then_paid`: time-limited trial, then parallel paid options (checks on all tiers).
   */
  pricingModel?: "freemium" | "trial_then_paid" | "free" | "license_first";
  pricing: AppPricingTier[];
  supportFacts: string[];
  privacySections: AppPrivacySection[];
  keywords: string[];
}

interface AppInput extends Omit<
  AppRecord,
  "landingPath" | "supportPath" | "privacyPath" | "appStoreUrl" | "appStoreId" | "hasAppStoreUrl"
  | "downloadUrl" | "hasDownloadUrl"
> {
  appStoreUrl: string | null;
  downloadUrl?: string | null;
}

const createApp = (input: AppInput): AppRecord => {
  const landingPath = `/${input.slug}`;
  const supportPath = `${landingPath}/support`;
  const privacyPath = `${landingPath}/privacy`;
  const appStoreIdMatch = input.appStoreUrl?.match(/\/id(\d+)/);

  return {
    ...input,
    landingPath,
    supportPath,
    privacyPath,
    appStoreId: appStoreIdMatch?.[1] ?? null,
    hasAppStoreUrl: input.appStoreUrl !== null,
    downloadUrl: input.downloadUrl ?? null,
    hasDownloadUrl: Boolean(input.downloadUrl),
  };
};

export const site = {
  name: "Givdul Apps",
  brand: "Givdul",
  domain: new URL(siteOrigin).hostname,
  origin: siteOrigin,
  description:
    "A compact catalog of focused Mac utilities from Givdul: window layout tools, region-based screen sharing for calls, direct downloads, and public support pages.",
  supportEmail: "support@givdul.com",
  supportMailto: "mailto:support@givdul.com",
  keywords: [
    "Givdul apps",
    "Mac utilities",
    "macOS apps",
    "indie Mac apps",
  ],
};

export const apps: AppRecord[] = [
  createApp({
    slug: "zones",
    status: "live",
    name: "Zones",
    productLabel: "Mac window manager",
    iconPath: "/zones-icon.png",
    appStoreUrl: null,
    downloadUrl: downloadUrls.zones,
    title: "Zones for Mac",
    tagline: "Window snapping from your menu bar.",
    description:
      "Zones is a free, lightweight macOS menu bar app for snapping windows into clean layouts with a Shift-drag gesture. Download it directly from the website, signed and notarized for Mac.",
    cardSummary:
      "Snap windows into clean layouts from the menu bar with one gesture and no setup friction.",
    supportSummary:
      "Official support for Zones, including common setup questions, Accessibility guidance, and direct contact.",
    privacySummary:
      "Privacy details for Zones, including local-only preferences, Accessibility use, and direct downloads.",
    heroTitle: "Zones for Mac",
    heroTagline: "Snap windows in one gesture",
    heroLede:
      "A lightweight menu bar app that turns drag-and-drop into precise window arrangement. No shortcuts to memorize.",
    heroVisualLabel: "Animated preview of Zones window snapping",
    workflowSteps: [
      { kind: "action", label: "Drag", icon: "plus" },
      { kind: "key", label: "Shift" },
      { kind: "action", label: "Drop", icon: "window" },
    ],
    proofPoints: [
      {
        title: "Menu bar first",
        copy: "Zones sits in your menu bar for quick access—snap windows by holding Shift while you drag. No learning curve.",
        icon: "window",
      },
      {
        title: "Simple by default",
        copy: "One gesture: drag, hold Shift, drop. Feels native to macOS.",
        icon: "gesture",
      },
      {
        title: "Free direct download",
        copy: "Zones is free. Download it directly, grant Accessibility once, and use it without an account or subscription.",
        icon: "star",
      },
    ],
    pricingIntro: {
      headline: "Free for Mac",
      subheadline:
        "Zones is a direct download, signed and notarized for macOS. Optional support links can come later.",
    },
    pricingModel: "free",
    pricing: [
      {
        name: "free",
        label: "Free",
        title: "Zones",
        price: "$0",
        note: "Direct download",
        lead: "The full window manager is free. No account, no trial timer, no subscription.",
        items: [
          "Shift-drag snapping",
          "Custom layouts and preset zones",
          "Local preferences on your Mac",
        ],
        cta: "Download free",
      },
    ],
    supportFacts: [
      "Zones is a macOS menu bar app for snapping windows into saved layouts with a simple Shift-drag gesture.",
      "Accessibility access is required so Zones can inspect, move, and resize other app windows when you trigger snapping.",
      "Zones is free and distributed as a direct Developer ID signed and notarized download.",
    ],
    privacySections: [
      {
        title: "What Zones uses",
        paragraphs: [
          "Zones stores app preferences and layout choices locally on your Mac, and uses the macOS Accessibility permission only when you trigger snapping.",
        ],
      },
      {
        title: "What Zones does not collect",
        paragraphs: [
          "Zones does not require an account, does not include third-party analytics or advertising SDKs, and does not send your layouts or preferences to a developer-controlled server.",
        ],
      },
      {
        title: "Distribution",
        paragraphs: [
          "Zones is distributed directly from the website. The app is free, so there is no purchase account or subscription entitlement for Zones.",
        ],
      },
      {
        title: "Contact",
        paragraphs: [
          "Questions about privacy or support: support@givdul.com. If the app’s data handling changes, this policy will be updated before the changed version is distributed.",
        ],
      },
    ],
    keywords: [
      "Zones",
      "Zones app",
      "Zones for Mac",
      "Zones macOS",
      "window snapping for Mac",
      "window manager Mac",
      "menu bar window manager",
    ],
  }),
  createApp({
    slug: "atoll",
    status: "live",
    name: "Atoll",
    productLabel: "Agent status island",
    appStoreUrl: null,
    downloadUrl: downloadUrls.atoll,
    title: "Atoll for Mac",
    tagline: "See what your coding agents are doing.",
    description:
      "Atoll is a free macOS menu bar app that places a small Dynamic-Island-style session capsule around the notch, showing which local AI coding agents are running, waiting, or done.",
    cardSummary:
      "A free notch island for local coding agents: Codex, Claude Code, OpenCode, and Gemini CLI.",
    supportSummary:
      "Official support for Atoll, including agent session detection, test mode, menu bar behavior, and local configuration.",
    privacySummary:
      "Privacy details for Atoll, including local agent session reads, hook events, and local-only settings.",
    heroTitle: "Atoll for Mac",
    heroTagline: "Your agents, right at the notch.",
    heroLede:
      "A tiny island that appears only when a local coding agent is running, waiting for input, asking permission, or just finished.",
    heroVisualLabel: "Interactive MacBook notch preview of Atoll agent sessions",
    workflowSteps: [
      { kind: "action", label: "Watch", icon: "window" },
      { kind: "key", label: "Codex" },
      { kind: "action", label: "Respond", icon: "plus" },
    ],
    proofPoints: [
      {
        title: "Attention only",
        copy: "Atoll stays out of the way until a session is active, waiting, or newly complete.",
        icon: "window",
      },
      {
        title: "Local harnesses",
        copy: "Built for Codex, Claude Code, OpenCode, and Gemini CLI session stores on your Mac.",
        icon: "gesture",
      },
      {
        title: "Free on purpose",
        copy: "Atoll is a free utility and a lightweight entry point into the rest of the Givdul Mac apps.",
        icon: "star",
      },
    ],
    pricingIntro: {
      headline: "Free, because it should be.",
      subheadline:
        "Atoll is a no-cost menu bar utility. No subscription, no trial timer, no paid unlock.",
    },
    pricingModel: "free",
    pricing: [
      {
        name: "free",
        label: "Free",
        title: "Atoll",
        price: "$0",
        note: "Direct download",
        lead: "The full app is free. It exists to make local agent work visible and point people toward the paid Givdul tools.",
        items: [
          "Notch island for live agent sessions",
          "Running, waiting, permission, and done states",
          "Local settings and session detection",
        ],
        cta: "Download free",
      },
    ],
    supportFacts: [
      "Atoll is a native macOS menu-bar app that shows local coding agent status in a small notch island.",
      "The island appears for running, waiting-for-input, waiting-for-permission, and recently completed sessions.",
      "Atoll is free and reads local agent session stores and hook events on your Mac.",
    ],
    privacySections: [
      {
        title: "What Atoll reads",
        paragraphs: [
          "Atoll watches local agent session stores and hook events so it can decide whether a session is running, waiting, needs permission, or has completed.",
        ],
      },
      {
        title: "Local settings",
        paragraphs: [
          "Atoll stores preferences such as enabled state, target screen, and test mode locally on your Mac in its configuration file.",
        ],
      },
      {
        title: "Accounts and payment",
        paragraphs: [
          "Atoll is free, does not require an account, and does not include a purchase or subscription entitlement.",
        ],
      },
      {
        title: "Contact",
        paragraphs: [
          "Questions about privacy or support: support@givdul.com. If data handling changes, this policy will be updated before a new build is distributed.",
        ],
      },
    ],
    keywords: [
      "Atoll",
      "Atoll for Mac",
      "AI agent status",
      "Codex CLI status",
      "Claude Code status",
      "OpenCode status",
      "Gemini CLI status",
      "macOS notch app",
    ],
  }),
  createApp({
    slug: "portal",
    status: "live",
    name: "Portal",
    productLabel: "Region screen sharing",
    appStoreUrl: appStoreUrls.portal,
    downloadUrl: downloadUrls.portal,
    title: "Portal for Mac",
    tagline: "Share part of a big screen—not the whole canvas.",
    description:
      "Portal is a paid macOS utility for people on large or ultrawide displays who do not want every pixel in the call: capture a chosen region, expose it through a shareable app window, and share that window instead of your entire desktop. Start with a 3-day full-featured trial, then buy once.",
    cardSummary:
      "Define what matters on a large monitor, pipe it through a 16:9 stage, and share it with one shortcut. Optional snap rails and bring-to-stage are extras for tidying the stage—not the headline.",
    supportSummary:
      "Support for Portal: region capture, Screen Recording, camera, Accessibility (optional), shortcuts, purchases, and contact.",
    privacySummary:
      "How Portal uses Screen Recording for your chosen region, optional Accessibility for snapping, direct purchases, and what stays on your Mac.",
    heroTitle: "Portal for Mac",
    heroTagline: "Region first. Calls stay legible.",
    heroLede:
      "Stop sending the entire ultrawide. Portal lets you point at the rectangle you care about, then feeds a composed 16:9 surface you can drop into Zoom, Meet, or Teams like any other window.",
    heroVisualLabel: "Diagram: wide display with one highlighted shared region flowing into a 16:9 stage",
    workflowSteps: [
      { kind: "action", label: "Region", icon: "plus" },
      { kind: "key", label: "⇧⌘P" },
      { kind: "action", label: "Share", icon: "window" },
    ],
    proofPoints: [
      {
        title: "Big desk, small signal",
        copy: "Ultrawide and 4K monitors are great for you and noisy for viewers. Portal keeps the share surface bounded to the content you choose.",
        icon: "window",
      },
      {
        title: "One predictable stage",
        copy: "That region is normalized into a 16:9 stage so remote participants see a familiar aspect—not your full bezel-to-bezel layout.",
        icon: "gesture",
      },
      {
        title: "Shortcut in muscle memory",
        copy: "Shift-Command-P toggles capture once permissions are set. Screen Recording covers the pixels; camera is optional; Accessibility only if you use window moves or snap rails inside the stage.",
        icon: "star",
      },
    ],
    pricingIntro: {
      headline: "Buy once. Use it forever.",
      subheadline:
        "Start with a 3-day full-featured trial. Portal is $7.99 as a one-time purchase.",
    },
    pricingModel: "license_first",
    pricing: [
      {
        name: "license",
        label: "One-time purchase",
        title: "One-time license",
        price: "$7.99",
        note: "One-time purchase",
        lead: "Try the full app for 3 days, then pay once and keep using Portal.",
        items: [
          "3-day full-featured trial",
          "Region sharing window",
          "Optional snapping helpers",
          "No subscription",
        ],
        cta: "Buy once",
        ctaUrl: checkoutUrls.portalLicense,
        emphasis: "recommended",
      },
    ],
    supportFacts: [
      "Portal lets you share a chosen region of a large display through a dedicated 16:9 stage window instead of broadcasting your entire screen.",
      "Screen Recording feeds the stage, camera is optional, and Accessibility is only needed for features that move other app windows.",
      "Portal is distributed directly from the website with a 3-day full-featured trial and a $7.99 one-time purchase.",
    ],
    privacySections: [
      {
        title: "What Portal uses",
        paragraphs: [
          "Portal uses macOS Screen Recording to read pixels for the region you include in the stage, and may use the camera for an optional overlay. Composition happens locally on your Mac.",
        ],
      },
      {
        title: "Optional permissions and local data",
        paragraphs: [
          "If you grant Accessibility, Portal can help align windows inside the stage or move another app window with Bring to Stage. Region capture still works without it, and app preferences such as presets and onboarding state are stored locally on your Mac.",
        ],
      },
      {
        title: "Accounts, analytics, and purchases",
        paragraphs: [
          "Portal does not include an in-app advertising SDK. Purchases are managed directly on the website, and license access is verified by the app when needed.",
        ],
      },
      {
        title: "Contact",
        paragraphs: [
          "Questions about privacy or support: support@givdul.com. If data handling changes, this policy will be updated before a new build is distributed.",
        ],
      },
    ],
    keywords: [
      "Portal",
      "Portal for Mac",
      "region screen share",
      "ultrawide screen share Mac",
      "share part of screen",
      "16:9 screen stage",
      "ScreenCaptureKit",
    ],
  }),
];

export const getAppBySlug = (slug: string) => apps.find((app) => app.slug === slug);
