<script lang="ts">
  import { onMount } from "svelte";
  import { fade, scale } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import {
    LAYER_ORDER,
    PRESET_ZONES,
    REFERENCE_WIDTH,
    ZONE_GAP,
    ZONE_RADIUS,
    displayFrame,
    nearestZone,
    type LayerId,
    type Rect,
  } from "../lib/zones";

  type Point = { x: number; y: number };

  const FIRST_LAYER_DELAY_MS = 400;
  const LAYER_PAUSE_MS = 1500;

  let stageEl: HTMLDivElement | undefined = $state();
  let width = $state(1120);
  let height = $state(630);
  const gap = $derived((width * ZONE_GAP) / REFERENCE_WIDTH);
  const radius = $derived((width * ZONE_RADIUS) / REFERENCE_WIDTH);

  // Layers stack one at a time the first time the stage is seen, then stay.
  let shownLayers = $state<LayerId[]>([]);
  const liveZones = $derived(PRESET_ZONES.filter((zone) => shownLayers.includes(zone.layer)));
  let introTimers: number[] = [];

  // A mouse drag on the stage stands in for dragging a window.
  let dragPoint = $state<Point | null>(null);
  let shiftHeld = $state(false);
  const activeZone = $derived(
    dragPoint && shiftHeld ? nearestZone(liveZones, dragPoint.x * width, dragPoint.y * height, width, height) : null,
  );

  let reduceMotion = $state(false);

  const frameStyle = (rect: Rect) => {
    const frame = displayFrame(rect, width, height, gap);
    return `left:${frame.x}px;top:${frame.y}px;width:${frame.w}px;height:${frame.h}px`;
  };

  function playIntro() {
    LAYER_ORDER.forEach((layer, index) => {
      introTimers.push(
        window.setTimeout(() => (shownLayers = [...shownLayers, layer]), FIRST_LAYER_DELAY_MS + index * LAYER_PAUSE_MS),
      );
    });
  }

  function finishIntro() {
    introTimers.forEach((timer) => window.clearTimeout(timer));
    introTimers = [];
    shownLayers = [...LAYER_ORDER];
  }

  function stagePoint(event: PointerEvent): Point {
    const box = stageEl!.getBoundingClientRect();
    const clamp = (value: number) => Math.min(Math.max(value, 0), 1);
    return { x: clamp((event.clientX - box.left) / box.width), y: clamp((event.clientY - box.top) / box.height) };
  }

  function onPointerDown(event: PointerEvent) {
    // Touch can't hold Shift, so touch keeps scrolling the page.
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    event.preventDefault();
    stageEl!.setPointerCapture(event.pointerId);
    finishIntro();
    shiftHeld = event.shiftKey;
    dragPoint = stagePoint(event);
  }

  function onPointerMove(event: PointerEvent) {
    if (!dragPoint) return;
    shiftHeld = event.shiftKey;
    dragPoint = stagePoint(event);
  }

  function endDrag() {
    dragPoint = null;
  }

  function onKey(event: KeyboardEvent) {
    if (event.key === "Shift") shiftHeld = event.type === "keydown";
  }

  onMount(() => {
    const resize = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width;
      height = entry.contentRect.height;
    });
    resize.observe(stageEl!);

    reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      finishIntro();
      return () => resize.disconnect();
    }

    const seen = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        seen.disconnect();
        playIntro();
      },
      { threshold: 0.5 },
    );
    seen.observe(stageEl!);

    return () => {
      resize.disconnect();
      seen.disconnect();
      introTimers.forEach((timer) => window.clearTimeout(timer));
    };
  });
</script>

<svelte:window onkeydown={onKey} onkeyup={onKey} onblur={() => (shiftHeld = false)} />

<div
  class="zs-stage"
  class:is-dragging={dragPoint !== null}
  style={`--zone-radius:${radius}px`}
  bind:this={stageEl}
  role="group"
  aria-label="Halves, fourths and sixths stacked on one display. Drag here with Shift held to see the zone a window would land in."
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
  onpointerup={endDrag}
  onpointercancel={endDrag}
>
  {#each LAYER_ORDER as layer (layer)}
    {#if shownLayers.includes(layer)}
      {#each PRESET_ZONES.filter((zone) => zone.layer === layer) as zone (zone.id)}
        <div class="zs-zone zs-zone--outline" style={frameStyle(zone.rect)}></div>
      {/each}
    {/if}
  {/each}

  {#if activeZone}
    {#key activeZone.id}
      <div
        class="zs-zone zs-zone--glass"
        style={frameStyle(activeZone.rect)}
        in:scale={{ start: 0.985, opacity: 0, duration: reduceMotion ? 0 : 110, easing: quintOut }}
        out:fade={{ duration: reduceMotion ? 0 : 110 }}
      ></div>
    {/key}
  {/if}
</div>

<style>
  .zs-stage {
    position: relative;
    aspect-ratio: 16 / 9;
    width: 100%;
    isolation: isolate;
    user-select: none;
    -webkit-user-select: none;
  }

  @media (pointer: fine) {
    .zs-stage {
      cursor: grab;
    }

    .zs-stage.is-dragging {
      cursor: grabbing;
    }
  }

  /* Zone surfaces follow ZoneOverlayController.swift. */
  .zs-zone {
    position: absolute;
    border-radius: var(--zone-radius);
    pointer-events: none;
  }

  /* InactiveOverlaySurface: tint 1.8%, white stroke 15%. Light uses a dark stroke so it reads on a light canvas. */
  .zs-zone--outline {
    background: light-dark(rgb(77 79 87 / 0.03), rgb(209 212 219 / 0.018));
    box-shadow:
      inset 0 0 0 1.05px light-dark(rgb(0 0 0 / 0.14), rgb(255 255 255 / 0.15)),
      0 3px 8px light-dark(rgb(0 0 0 / 0.04), rgb(209 212 219 / 0.05));
    animation: zs-zone-in 700ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes zs-zone-in {
    from {
      opacity: 0;
      transform: scale(0.97);
    }
  }

  /* ActiveZoneOverlaySurface, Liquid Glass style: tint 6%, white stroke 16%, soft drop shadow. */
  .zs-zone--glass {
    background:
      linear-gradient(
        160deg,
        light-dark(rgb(255 255 255 / 0.7), rgb(255 255 255 / 0.07)),
        light-dark(rgb(255 255 255 / 0.35), rgb(255 255 255 / 0.012)) 45%,
        light-dark(rgb(255 255 255 / 0.5), rgb(255 255 255 / 0.03))
      ),
      light-dark(rgb(77 79 87 / 0.04), rgb(209 212 219 / 0.025));
    -webkit-backdrop-filter: blur(16px) saturate(1.5) brightness(1.04);
    backdrop-filter: blur(16px) saturate(1.5) brightness(1.04);
    box-shadow:
      inset 0 0 0 1px light-dark(rgb(0 0 0 / 0.1), rgb(255 255 255 / 0.16)),
      inset 0 1px 0.5px light-dark(rgb(255 255 255 / 0.9), rgb(255 255 255 / 0.26)),
      inset 0 -1px 0.5px rgb(255 255 255 / 0.08),
      0 8px 18px rgb(0 0 0 / 0.08);
  }

  @media (prefers-reduced-motion: reduce) {
    .zs-zone--outline {
      animation: none;
    }
  }

  @media (prefers-reduced-transparency: reduce) {
    .zs-zone--glass {
      background: light-dark(rgb(250 250 252), rgb(58 59 63));
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
    }
  }
</style>
