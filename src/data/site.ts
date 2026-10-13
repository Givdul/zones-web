const fallbackSiteOrigin = "https://apps.givdul.com";
const configuredSiteOrigin = import.meta.env.PUBLIC_SITE_ORIGIN?.trim();

const resolveUrl = (value: string, fallback: string) => {
  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    return fallback;
  }
};

const siteOrigin = configuredSiteOrigin
  ? resolveUrl(configuredSiteOrigin, fallbackSiteOrigin)
  : fallbackSiteOrigin;

const downloadUrls = {
  zones: import.meta.env.PUBLIC_ZONES_DOWNLOAD_URL?.trim() || null,
  atoll: import.meta.env.PUBLIC_ATOLL_DOWNLOAD_URL?.trim() || null,
} as const;

// Read legacy Portal distribution variables for configuration compatibility, but keep Frame unpublished.
void import.meta.env.PUBLIC_PORTAL_APP_STORE_URL;
void import.meta.env.PUBLIC_PORTAL_DOWNLOAD_URL;

const checkoutUrls = {
  portalLicense: import.meta.env.PUBLIC_POLAR_PORTAL_LICENSE_CHECKOUT_URL?.trim() || null,
  zonesLicense: import.meta.env.PUBLIC_POLAR_ZONES_LICENSE_CHECKOUT_URL?.trim() || null,
} as const;

/** End of the Zones launch discount, from `PUBLIC_ZONES_LAUNCH_OFFER_ENDS` (YYYY-MM-DD). Null when unset, invalid, or past at build time. */
const resolveZonesLaunchOfferEnd = () => {
  const value = import.meta.env.PUBLIC_ZONES_LAUNCH_OFFER_ENDS?.trim();
  if (!value) return null;
  const end = new Date(`${value}T23:59:59Z`);
  if (Number.isNaN(end.getTime()) || end.getTime() < Date.now()) return null;
  return end;
};

const zonesLaunchOfferEnd = resolveZonesLaunchOfferEnd();
const zonesLaunchOfferEndLabel = zonesLaunchOfferEnd?.toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

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
      "Zones is a lightweight macOS menu bar app for snapping windows into clean layouts with a Shift-drag gesture. Try it free for 14 days, then buy a one-time $7.99 license. No subscription or account.",
    cardSummary:
      "Snap windows into clean layouts from the menu bar with one gesture and no setup friction.",
    supportSummary:
      "Official support for Zones, including common setup questions, Accessibility guidance, and direct contact.",
    privacySummary:
      "Privacy details for Zones, including local preferences, Accessibility use, license checks, and Polar downloads and purchases.",
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
        copy: "Zones sits in your menu bar for quick access—snap windows by holding Shift while you drag.",
        icon: "window",
      },
      {
        title: "Simple by default",
        copy: "Drag, hold Shift, and drop to arrange a window.",
        icon: "gesture",
      },
      {
        title: "Try it, then keep it",
        copy: "Every feature is free for 14 days. Then one $7.99 license, no account or subscription.",
        icon: "star",
      },
    ],
    pricingIntro: {
      headline: "Try it for 14 days.",
      subheadline: "Then keep it for $7.99, once.",
    },
    pricingModel: "trial_then_paid",
    pricing: [
      {
        name: "trial",
        label: "Free trial",
        title: "Zones",
        price: "14 days",
        note: "Free from first launch",
        lead: "Every feature, no account. Snapping pauses when the trial ends.",
        items: [
          "Shift-drag snapping",
          "Custom layouts and preset zones",
          "Local preferences on your Mac",
        ],
        cta: "Download free trial",
        ctaUrl: downloadUrls.zones,
      },
      {
        name: "license",
        label: "One-time license",
        title: "Zones License",
        price: zonesLaunchOfferEndLabel ? "$4.99" : "$7.99",
        note: zonesLaunchOfferEndLabel
          ? `Launch price until ${zonesLaunchOfferEndLabel}, then $7.99`
          : "One-time purchase",
        lead: "Keep snapping after the trial. Enter the key in Settings.",
        items: [
          "Up to 2 Macs",
          "No subscription or account",
          "Manage activations in the Polar portal",
        ],
        cta: checkoutUrls.zonesLicense ? "Buy license" : "Coming soon",
        ctaUrl: checkoutUrls.zonesLicense,
        emphasis: "recommended",
      },
    ],
    supportFacts: [
      "Zones is a macOS menu bar app for snapping windows into saved layouts with a simple Shift-drag gesture.",
      "Accessibility access is required so Zones can inspect, move, and resize other app windows when you trigger snapping.",
      "Zones is free for 14 days from first launch. After that, Shift-drag snapping stops until you enter a license key in Settings. Settings and the layout editor stay available.",
      "A $7.99 one-time license covers up to 2 Macs. Manage or remove activations at polar.sh/hansen-software/portal.",
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
          "Zones does not require an account and does not include third-party analytics or advertising SDKs. Your layouts, window activity, and Accessibility state are never sent anywhere.",
        ],
      },
      {
        title: "License checks",
        paragraphs: [
          "Zones stores the trial start date and your license key locally on your Mac.",
          "It contacts Polar's license API only when you activate a license, when you remove it from a Mac, and once at launch to confirm a stored license is still valid. Those requests send the license key, the activation ID, and your Mac's computer name as the activation label, which you can see in the Polar customer portal.",
        ],
      },
      {
        title: "Downloads and purchases",
        paragraphs: [
          "Downloads and licenses are delivered through Polar, which is the merchant of record and processes payment. Polar may process the information needed for the download or purchase, such as the checkout request and your email address. Zones does not use this information.",
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
    slug: "topside",
    status: "live",
    name: "Topside",
    productLabel: "Agent status island",
    iconPath: "/atoll-icon.png",
    appStoreUrl: null,
    downloadUrl: downloadUrls.atoll,
    title: "Topside for Mac",
    tagline: "See what your coding agents are doing.",
    description:
      "Topside is a macOS menu bar app that places a small session capsule around the notch, showing local coding agent activity.",
    cardSummary:
      "A notch island for local coding agents: Codex, Claude Code, Cursor Agent, OpenCode, and Pi.",
    supportSummary:
      "Official support for Topside, including local hook events, test mode, menu bar behavior, and local configuration.",
    privacySummary:
      "Privacy details for Topside, including local hook events and persisted lifecycle state, and local-only settings.",
    heroTitle: "Topside for Mac",
    heroTagline: "Your agents, right at the notch.",
    heroLede:
      "A tiny island that shows when a local coding agent is running, needs input, needs permission, has finished, failed, or was cancelled.",
    heroVisualLabel: "Interactive MacBook notch preview of Topside agent sessions",
    workflowSteps: [
      { kind: "action", label: "Watch", icon: "window" },
      { kind: "key", label: "Codex" },
      { kind: "action", label: "Respond", icon: "plus" },
    ],
    proofPoints: [
      {
        title: "Minimal overview",
        copy: "Event-driven local hooks send minimal lifecycle events to a user-only Unix socket.",
        icon: "window",
      },
      {
        title: "Five confirmed providers",
        copy: "Topside supports Codex, Claude Code, Cursor Agent, OpenCode, and Pi.",
        icon: "gesture",
      },
      {
        title: "One license, no account",
        copy: "Try Topside for 72 hours, then unlock it with one $7.99 Polar license. No subscription.",
        icon: "star",
      },
    ],
    pricingIntro: {
      headline: "Visible agent work, without a subscription.",
      subheadline:
        "Topside includes a 72-hour trial, then uses one $7.99 Polar license. No account or subscription.",
    },
    pricingModel: "license_first",
    pricing: [
      {
        name: "license",
        label: "One-time license",
        title: "Topside",
        price: "$7.99",
        note: "One-time Polar license",
        lead: "Try Topside for 72 hours, then unlock the full app with one license.",
        items: [
          "Notch island for live agent sessions",
          "Running, input, permission, finished, failed, and cancelled states",
          "Five confirmed local agent providers",
        ],
        cta: "Coming soon",
      },
    ],
    supportFacts: [
      "Topside is a native macOS menu-bar app that shows local coding agent status in a small notch island.",
      "The island appears for running, needs input, needs permission, finished, failed, and cancelled states.",
      "Topside receives minimal lifecycle events from local hooks through a user-only Unix socket and persists lifecycle state locally.",
    ],
    privacySections: [
      {
        title: "What Topside reads",
        paragraphs: [
          "Topside receives minimal lifecycle events from local hooks through a user-only Unix socket and stores relevant settings locally.",
        ],
      },
      {
        title: "Local settings and providers",
        paragraphs: [
          "Topside stores its settings locally on your Mac and supports Codex, Claude Code, Cursor Agent, OpenCode, and Pi.",
        ],
      },
      {
        title: "Accounts and payment",
        paragraphs: [
          "Topside offers one 72-hour trial and one $7.99 Polar license. It does not require an account or subscription.",
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
      "Topside",
      "Topside for Mac",
      "AI agent status",
      "Codex CLI status",
      "Claude Code status",
      "OpenCode status",
      "Cursor Agent status",
      "macOS notch app",
    ],
  }),
  createApp({
    slug: "frame",
    status: "live",
    name: "Frame",
    productLabel: "Fixed-aspect stage window",
    iconPath: "/frame-icon.png",
    appStoreUrl: null,
    downloadUrl: null,
    title: "Frame for Mac",
    tagline: "Share a fixed stage—not your whole canvas.",
    description:
      "Frame is a host-only fixed-aspect stage window for meeting and streaming apps. Share the Frame window instead of your entire desktop.",
    cardSummary:
      "Share a fixed-aspect stage window from a large or ultrawide display. Choose a 720p, 1080p, or 1440p 16:9 preset.",
    supportSummary:
      "Support for Frame: the stage window, Screen Recording, optional Accessibility for live Shift-drag snapping, presets, and contact.",
    privacySummary:
      "How Frame uses Screen Recording for the live stage, optional Accessibility for live Shift-drag snapping, and what stays on your Mac.",
    heroTitle: "Frame for Mac",
    heroTagline: "Fixed stage. Calls stay legible.",
    heroLede:
      "Share the Frame window in Zoom, Meet, Teams, or streaming apps. The live stage uses a fixed 16:9 aspect ratio.",
    heroVisualLabel: "Diagram: wide display with a fixed 16:9 Frame stage window",
    workflowSteps: [
      { kind: "action", label: "Stage", icon: "plus" },
      { kind: "key", label: "⇧⌘P" },
      { kind: "action", label: "Share", icon: "window" },
    ],
    proofPoints: [
      {
        title: "Big desk, small signal",
        copy: "Frame gives meeting and streaming apps one fixed-aspect window instead of your full desktop canvas.",
        icon: "window",
      },
      {
        title: "One predictable stage",
        copy: "Presets are 720p, 1080p, and 1440p, all at 16:9.",
        icon: "gesture",
      },
      {
        title: "Shortcut in muscle memory",
        copy: "Screen Recording is required for the live stage. Accessibility is optional for live Shift-drag snapping.",
        icon: "star",
      },
    ],
    pricingIntro: {
      headline: "A stage window for sharing.",
      subheadline:
        "Frame pricing, trial, and delivery details are coming soon.",
    },
    pricingModel: "license_first",
    pricing: [
      {
        name: "license",
        label: "Coming soon",
        title: "Release details",
        price: "Coming soon",
        note: "Pricing details coming soon",
        lead: "Frame pricing, trial, and delivery details are coming soon.",
        items: [
          "Fixed-aspect stage window",
          "720p, 1080p, and 1440p presets",
          "Screen Recording for the live stage",
          "Optional Accessibility for Shift-drag snapping",
        ],
        cta: "Coming soon",
        ctaUrl: null,
        emphasis: "recommended",
      },
    ],
    supportFacts: [
      "Frame provides a dedicated fixed-aspect stage window for meeting and streaming apps.",
      "Screen Recording is required for the live stage. Accessibility is optional for live Shift-drag snapping.",
      "Frame release, pricing, trial, commerce, and delivery details are coming soon.",
    ],
    privacySections: [
      {
        title: "What Frame uses",
        paragraphs: [
          "Frame uses macOS Screen Recording for the live stage. Composition happens locally on your Mac.",
        ],
      },
      {
        title: "Optional permissions and local data",
        paragraphs: [
          "If you grant Accessibility, Frame can support live Shift-drag snapping. App preferences such as presets and onboarding state are stored locally on your Mac.",
        ],
      },
      {
        title: "Accounts and local data",
        paragraphs: [
          "Frame does not include an in-app advertising SDK. Pricing, commerce, and license details remain unpublished.",
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
      "Frame",
      "Frame for Mac",
      "fixed-aspect stage window",
      "ultrawide screen share Mac",
      "share a stage window",
      "16:9 screen stage",
      "ScreenCaptureKit",
    ],
  }),
];

export const getAppBySlug = (slug: string) => apps.find((app) => app.slug === slug);
