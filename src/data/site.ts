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
  zones: resolveAppStoreUrl(
    import.meta.env.PUBLIC_ZONES_APP_STORE_URL?.trim() ??
      import.meta.env.PUBLIC_APP_STORE_URL?.trim(),
  ),
  portal: resolveAppStoreUrl(import.meta.env.PUBLIC_PORTAL_APP_STORE_URL?.trim()),
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
  /** Optional visual emphasis on the pricing card (e.g. recommended paid tier). */
  emphasis?: "recommended";
}

export interface AppFaqItem {
  question: string;
  answer: string;
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
  pricingModel?: "freemium" | "trial_then_paid";
  pricing: AppPricingTier[];
  faq: AppFaqItem[];
  supportFacts: string[];
  privacySections: AppPrivacySection[];
  keywords: string[];
}

interface AppInput extends Omit<
  AppRecord,
  "landingPath" | "supportPath" | "privacyPath" | "appStoreUrl" | "appStoreId" | "hasAppStoreUrl"
> {
  appStoreUrl: string | null;
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
  };
};

export const site = {
  name: "Givdul Apps",
  brand: "Givdul",
  domain: new URL(siteOrigin).hostname,
  origin: siteOrigin,
  description:
    "A compact catalog of focused Mac apps with direct App Store calls to action and public support pages.",
  supportEmail: "support@givdul.com",
  supportMailto: "mailto:support@givdul.com",
  keywords: [
    "Givdul apps",
    "Mac utilities",
    "macOS apps",
    "indie Mac apps",
    "App Store Mac apps",
  ],
};

export const apps: AppRecord[] = [
  createApp({
    slug: "zones",
    status: "live",
    name: "Zones",
    productLabel: "Mac window manager",
    iconPath: "/zones-icon.png",
    appStoreUrl: appStoreUrls.zones,
    title: "Zones for Mac",
    tagline: "Window snapping from your menu bar.",
    description:
      "Zones is a lightweight macOS menu bar app for snapping windows into clean layouts. Start with a seven-day trial of the full app, then keep it with a small subscription or a one-time lifetime purchase—all your personal Macs. There is no permanent free tier.",
    cardSummary:
      "Snap windows into clean layouts from the menu bar with one gesture and no setup friction.",
    supportSummary:
      "Official support for Zones, including common setup questions, Accessibility guidance, and direct contact.",
    privacySummary:
      "Privacy details for Zones, including local-only preferences, Accessibility use, and App Store purchase handling.",
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
        copy: "Click the icon and start arranging windows immediately. No learning curve.",
        icon: "window",
      },
      {
        title: "Simple by default",
        copy: "One gesture: drag, hold Shift, drop. Feels native to macOS.",
        icon: "gesture",
      },
      {
        title: "Trial first",
        copy: "Seven days of full access so you can judge it in real workflows—not a stripped-down mode.",
        icon: "star",
      },
    ],
    pricingIntro: {
      headline: "Simple pricing",
      subheadline:
        "Seven-day trial with full access, then choose a small subscription or pay once—on all your personal Macs. No ongoing free tier.",
    },
    pricingModel: "trial_then_paid",
    pricing: [
      {
        name: "trial",
        label: "Trial",
        title: "Full access",
        price: "7 days",
        note: "Try before you pay",
        lead:
          "Every feature unlocked during the trial. When it ends, a subscription or lifetime purchase is required to keep using Zones.",
        items: [
          "Built-in layouts (halves, thirds, 2×2, 3×2) and custom layouts",
          "Shift-drag zone preview and custom layout editor",
          "Unlimited saved layouts and per-display configuration",
          "No account required",
        ],
        cta: "Start trial",
      },
      {
        name: "pro-subscription",
        label: "Pro",
        title: "Subscription",
        price: "$1.99",
        note: "per month · $17.99/yr",
        lead: "After your trial, subscribe in the app to keep full access. Cancel anytime.",
        emphasis: "recommended",
        items: [
          "Keeps the same full app you used in the trial",
          "Cancel anytime in the App Store",
          "All your personal Macs",
        ],
        cta: "Subscribe",
      },
      {
        name: "lifetime",
        label: "Pro",
        title: "Lifetime",
        price: "$49",
        note: "One-time purchase",
        lead: "Own Pro outright with a single payment—same features as subscription.",
        items: [
          "One payment, same full feature set",
          "No subscription or renewals",
          "All your personal Macs",
        ],
        cta: "Buy lifetime",
      },
    ],
    faq: [
      {
        question: "How do I start using Zones?",
        answer:
          "Install the app, launch it, and grant Accessibility access once. After that, hold Shift while dragging a window to preview zones and drop it into place.",
      },
      {
        question: "Why does Zones ask for Accessibility access?",
        answer:
          "macOS requires Accessibility permission for apps that inspect, move, and resize windows in other apps. Zones uses that permission only to preview and place windows when you trigger it.",
      },
      {
        question: "What happens after the trial?",
        answer:
          "Zones does not offer a permanent free tier. After the seven-day trial, you need an active subscription ($1.99/month or $17.99/year) or the lifetime purchase ($49) to continue using the app. Both paid options include the same full feature set.",
      },
      {
        question: "What do subscription and lifetime include?",
        answer:
          "Both include the complete app: built-in layouts, the custom layout editor, unlimited saved layouts, Shift-drag preview, and per-display configuration. Start with a seven-day trial of everything, then pay through the App Store.",
      },
      {
        question: "How does the trial work?",
        answer:
          "New installs get seven days of unrestricted access. When the trial ends, choose a subscription or the lifetime option to keep going—there is no separate free mode afterward.",
      },
      {
        question: "How do restore purchases work?",
        answer:
          "Open Settings, go to the layouts area, and use Restore Purchases in the Pro sheet. The restore flow is handled by the App Store for the Apple Account that owns the subscription or lifetime purchase.",
      },
      {
        question: "What if Zones does not appear in Accessibility settings?",
        answer:
          "Open the Accessibility section in System Settings and add Zones from Finder if macOS does not list it automatically. Reinstalling or re-signing a build can require granting access again.",
      },
      {
        question: "Does Zones require an account or send my layout data anywhere?",
        answer:
          "No. Zones does not require an account, does not include third-party analytics or advertising SDKs, and stores app preferences locally on your Mac.",
      },
    ],
    supportFacts: [
      "Zones is a macOS menu bar app for window snapping. New installs get a seven-day trial of the full app; after that, a subscription ($1.99/month or $17.99/year) or a $49 lifetime purchase is required—there is no permanent free tier. Paid plans cover all your personal Macs.",
      "Accessibility access is required so Zones can inspect, move, and resize windows in other apps when you trigger snapping.",
    ],
    privacySections: [
      {
        title: "Data Zones stores",
        paragraphs: [
          "Zones stores app preferences and layout choices locally on your Mac so the app can remember your setup between launches.",
          "Zones uses the macOS Accessibility permission only to inspect, move, and resize windows after you trigger the window-zoning interaction.",
        ],
      },
      {
        title: "Data Zones does not collect",
        paragraphs: [
          "Zones does not require an account and does not collect personal information through a sign-in or profile system.",
          "Zones does not include third-party analytics, advertising SDKs, or external crash-reporting services. It does not transmit layout preferences, Accessibility state, or purchase intent to an external server.",
        ],
      },
      {
        title: "Purchases",
        paragraphs: [
          "After the trial period, Zones is available only through an auto-renewing subscription or a one-time in-app purchase (lifetime), handled by the App Store. Apple processes payment information and purchase receipts according to Apple’s policies.",
          "Zones does not store your payment information on a developer-controlled server.",
        ],
      },
      {
        title: "Contact",
        paragraphs: [
          "If you have questions about privacy or support, contact support@givdul.com.",
          "If the app’s data handling changes in the future, this policy should be updated before the changed version is distributed.",
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
    slug: "portal",
    status: "live",
    name: "Portal",
    productLabel: "Mac launcher and switcher",
    appStoreUrl: appStoreUrls.portal,
    title: "Portal for Mac",
    tagline: "Open the right thing without hunting for it.",
    description:
      "Portal is a focused macOS utility for getting back to active work faster. It gives you one compact surface for the items, destinations, and contexts you return to all day.",
    cardSummary:
      "A staged landing page for a future Mac utility focused on fast context switching and repeat access.",
    supportSummary:
      "Public support for Portal, including setup notes, early-product answers, and direct contact.",
    privacySummary:
      "Privacy details for Portal, including local storage expectations and the absence of accounts or tracking by default.",
    heroTitle: "Portal for Mac",
    heroTagline: "Jump back into context",
    heroLede:
      "A compact launcher for the things you reopen constantly. Less browsing, less hunting, less friction between tasks.",
    heroVisualLabel: "Illustrated preview of Portal shortcuts and recent destinations",
    workflowSteps: [
      { kind: "action", label: "Open", icon: "plus" },
      { kind: "key", label: "Portal" },
      { kind: "action", label: "Resume", icon: "window" },
    ],
    proofPoints: [
      {
        title: "Immediate recall",
        copy: "Bring back the destinations you use repeatedly instead of rebuilding context from scratch.",
        icon: "window",
      },
      {
        title: "Low-friction flow",
        copy: "One small surface for switching tasks quickly without managing a heavy workspace system.",
        icon: "gesture",
      },
      {
        title: "Staged early",
        copy: "The product page and support routes are ready before the App Store release is wired in.",
        icon: "star",
      },
    ],
    pricing: [
      {
        name: "free",
        label: "Stage",
        title: "Product page live",
        price: "Soon",
        note: "App Store link pending",
        lead: "The routing, content model, support page, and privacy page are staged now.",
        items: [
          "Landing page under /portal",
          "Public support URL",
          "Dedicated privacy policy",
          "App Store wiring can be added later via env var",
        ],
        cta: "App Store soon",
      },
      {
        name: "pro",
        label: "Roadmap",
        title: "Ready for launch details",
        price: "TBD",
        note: "Content can evolve in place",
        lead: "This slot can absorb real pricing, screenshots, and feature detail without changing the route structure.",
        items: [
          "Real App Store URL via PUBLIC_PORTAL_APP_STORE_URL",
          "Product-specific FAQ",
          "Launch pricing and CTA copy",
        ],
        cta: "Launch later",
      },
    ],
    faq: [
      {
        question: "Is Portal available yet?",
        answer:
          "The public site structure is staged, but the App Store release is not wired in yet. Once the product is ready, the App Store URL can be added without changing the route structure.",
      },
      {
        question: "Why is the support page live before the app launches?",
        answer:
          "The support and privacy routes are part of the launch surface. Staging them early keeps the site structure stable and reduces release-day cleanup.",
      },
      {
        question: "Will Portal require an account?",
        answer:
          "The current plan assumes a lightweight Mac utility with no account requirement by default. If that changes, the privacy policy should be updated before launch.",
      },
    ],
    supportFacts: [
      "Portal is staged as a future macOS utility focused on fast context switching and repeat access to frequently used destinations.",
      "This public support URL is already in place so product, App Store, and privacy references can point to a stable path from day one.",
    ],
    privacySections: [
      {
        title: "Current privacy expectation",
        paragraphs: [
          "Portal is currently staged as a lightweight Mac utility with no account requirement and no default third-party analytics or advertising SDKs.",
          "If the shipping product stores preferences, the intention is for that data to remain local unless a later feature clearly requires sync.",
        ],
      },
      {
        title: "What will be updated before launch",
        paragraphs: [
          "If Portal ships with different data handling than described here, this page should be updated before the App Store release goes live.",
          "Any change involving accounts, sync, analytics, or remote storage should be documented here first.",
        ],
      },
      {
        title: "Contact",
        paragraphs: [
          "If you have questions about privacy or support, contact support@givdul.com.",
          "This staged page exists so the privacy route is stable before launch assets are finalized.",
        ],
      },
    ],
    keywords: [
      "Portal",
      "Portal for Mac",
      "Mac launcher",
      "context switcher Mac",
      "productivity utility Mac",
    ],
  }),
];

export const getAppBySlug = (slug: string) => apps.find((app) => app.slug === slug);
