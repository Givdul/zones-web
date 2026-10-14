// Geometry ported from the Zones macOS app (ZoneLayoutConfig.swift, SharedGeometry.swift)
// so the web stage draws and picks zones the way the app does.
// Rects here are normalized with a top-left origin; the app uses a bottom-left origin.

export type Rect = { x: number; y: number; w: number; h: number };

export type LayerId = "halves" | "fourths" | "sixths";

export type Zone = { id: string; title: string; layer: LayerId; rect: Rect };

/** Reference display the app's point metrics are scaled from (14" MacBook Pro, 1512 pt wide). */
export const REFERENCE_WIDTH = 1512;
/** `ZoneMetrics.defaultInnerGap`; the app also uses the gap as the content inset. */
export const ZONE_GAP = 12;
/** Corner radius of every zone surface in the app. */
export const ZONE_RADIUS = 20;

export const LAYER_ORDER: LayerId[] = ["halves", "fourths", "sixths"];

const third = 1 / 3;

export const PRESET_ZONES: Zone[] = [
  { id: "halves-left", title: "Left Half", layer: "halves", rect: { x: 0, y: 0, w: 0.5, h: 1 } },
  { id: "halves-right", title: "Right Half", layer: "halves", rect: { x: 0.5, y: 0, w: 0.5, h: 1 } },

  { id: "fourths-tl", title: "Top Left", layer: "fourths", rect: { x: 0, y: 0, w: 0.5, h: 0.5 } },
  { id: "fourths-tr", title: "Top Right", layer: "fourths", rect: { x: 0.5, y: 0, w: 0.5, h: 0.5 } },
  { id: "fourths-bl", title: "Bottom Left", layer: "fourths", rect: { x: 0, y: 0.5, w: 0.5, h: 0.5 } },
  { id: "fourths-br", title: "Bottom Right", layer: "fourths", rect: { x: 0.5, y: 0.5, w: 0.5, h: 0.5 } },

  { id: "sixths-tl", title: "Top Left Sixth", layer: "sixths", rect: { x: 0, y: 0, w: third, h: 0.5 } },
  { id: "sixths-tm", title: "Top Middle Sixth", layer: "sixths", rect: { x: third, y: 0, w: third, h: 0.5 } },
  { id: "sixths-tr", title: "Top Right Sixth", layer: "sixths", rect: { x: 2 * third, y: 0, w: third, h: 0.5 } },
  { id: "sixths-bl", title: "Bottom Left Sixth", layer: "sixths", rect: { x: 0, y: 0.5, w: third, h: 0.5 } },
  { id: "sixths-bm", title: "Bottom Middle Sixth", layer: "sixths", rect: { x: third, y: 0.5, w: third, h: 0.5 } },
  { id: "sixths-br", title: "Bottom Right Sixth", layer: "sixths", rect: { x: 2 * third, y: 0.5, w: third, h: 0.5 } },
];

const isAtBoundary = (value: number) => Math.abs(value) < 0.0001;

/** `ZoneMetrics.displayFrame`: the visible frame of a zone, inset from the screen edge and split by the gap. */
export function displayFrame(rect: Rect, width: number, height: number, gap: number): Rect {
  const contentW = width - gap * 2;
  const contentH = height - gap * 2;
  const frame = {
    x: gap + rect.x * contentW,
    y: gap + rect.y * contentH,
    w: rect.w * contentW,
    h: rect.h * contentH,
  };
  const halfGap = gap / 2;

  if (!isAtBoundary(rect.x)) {
    frame.x += halfGap;
    frame.w -= halfGap;
  }
  if (!isAtBoundary(1 - (rect.x + rect.w))) frame.w -= halfGap;
  if (!isAtBoundary(rect.y)) {
    frame.y += halfGap;
    frame.h -= halfGap;
  }
  if (!isAtBoundary(1 - (rect.y + rect.h))) frame.h -= halfGap;

  return frame;
}

/** `WindowDragMonitor.currentNearestZoneSelection`: the zone whose activation centre is closest to the pointer. */
export function nearestZone(zones: Zone[], px: number, py: number, width: number, height: number): Zone | null {
  let best: Zone | null = null;
  let bestDistance = Infinity;
  for (const zone of zones) {
    const dx = (zone.rect.x + zone.rect.w / 2) * width - px;
    const dy = (zone.rect.y + zone.rect.h / 2) * height - py;
    const distance = dx * dx + dy * dy;
    if (distance < bestDistance) {
      best = zone;
      bestDistance = distance;
    }
  }
  return best;
}
