<script module lang="ts">
  function parseHSL(hslStr: string): { h: number; s: number; l: number } {
    const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
    if (!match) return { h: 205, s: 36, l: 78 };
    return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) };
  }

  export function buildBoxShadow(glowColor: string, intensity: number): string {
    const { h, s, l } = parseHSL(glowColor);
    const base = `${h}deg ${s}% ${l}%`;
    const layers: [number, number, number, number, number, boolean][] = [
      [0, 0, 1, 0, 60, false],
      [0, 0, 3, 0, 50, false],
      [0, 0, 6, 0, 40, false],
      [0, 0, 15, 0, 30, false],
      [0, 0, 25, 2, 20, false],
      [0, 0, 50, 2, 10, false]
    ];
    return layers
      .map(([x, y, blur, spread, alpha, inset]) => {
        const a = Math.min(alpha * intensity, 100);
        return `${inset ? 'inset ' : ''}${x}px ${y}px ${blur}px ${spread}px hsl(${base} / ${a}%)`;
      })
      .join(', ');
  }

  export function buildHSLColor(glowColor: string, alpha = 1): string {
    const { h, s, l } = parseHSL(glowColor);
    return `hsl(${h}deg ${s}% ${l}% / ${alpha})`;
  }

  export function easeOutCubic(x: number) {
    return 1 - Math.pow(1 - x, 3);
  }

  export function easeInCubic(x: number) {
    return x * x * x;
  }

  export function easeOutBack(x: number) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }

</script>

<script lang="ts">
  import { onMount } from 'svelte';

  type Props = {
    edgeSensitivity?: number;
    glowColor?: string;
    backgroundColor?: string;
    glowRadius?: number;
    glowIntensity?: number;
    coneSpread?: number;
    animated?: boolean;
  };

  let {
    edgeSensitivity = 30,
    glowColor = '205 36 78',
    backgroundColor = '#242426',
    glowRadius = 36,
    glowIntensity = 0.7,
    coneSpread = 22,
    animated = false
  }: Props = $props();

  let hostRef: HTMLSpanElement;
  let cardRef: HTMLElement | null = null;
  let isHovered = $state(false);
  let cursorAngle = $state(45);
  let edgeProximity = $state(0);
  let sweepActive = $state(false);
  let cardRadius = $state('28px');
  let markerX = $state(0);
  let markerY = $state(0);
  let markerScale = $state(1);

  function getCenterOf(el: HTMLElement) {
    const { width, height } = el.getBoundingClientRect();
    return [width / 2, height / 2];
  }

  function getEdgeProximity(el: HTMLElement, x: number, y: number) {
    const [cx, cy] = getCenterOf(el);
    const dx = x - cx;
    const dy = y - cy;
    let kx = Infinity;
    let ky = Infinity;
    if (dx !== 0) kx = cx / Math.abs(dx);
    if (dy !== 0) ky = cy / Math.abs(dy);
    return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
  }

  function getCursorAngle(el: HTMLElement, x: number, y: number) {
    const [cx, cy] = getCenterOf(el);
    const dx = x - cx;
    const dy = y - cy;
    if (dx === 0 && dy === 0) return 0;
    const radians = Math.atan2(dy, dx);
    let degrees = radians * (180 / Math.PI) + 90;
    if (degrees < 0) degrees += 360;
    return degrees;
  }

  function getPointAtAngle(el: HTMLElement, angle: number) {
    const { width, height } = el.getBoundingClientRect();
    const cx = width / 2;
    const cy = height / 2;
    const radians = angle * (Math.PI / 180);
    const dx = Math.sin(radians);
    const dy = -Math.cos(radians);
    const sx = dx === 0 ? Infinity : cx / Math.abs(dx);
    const sy = dy === 0 ? Infinity : cy / Math.abs(dy);
    const scale = Math.min(sx, sy);
    return {
      x: cx + dx * scale,
      y: cy + dy * scale
    };
  }

  function clampPoint(el: HTMLElement, x: number, y: number, inset = 8) {
    const { width, height } = el.getBoundingClientRect();
    return {
      x: Math.min(Math.max(x, inset), width - inset),
      y: Math.min(Math.max(y, inset), height - inset)
    };
  }

  function updateMarkerFromAngle(angle = cursorAngle) {
    if (!cardRef) return;
    const point = getPointAtAngle(cardRef, angle);
    const clamped = clampPoint(cardRef, point.x, point.y);
    markerX = clamped.x;
    markerY = clamped.y;
  }

  function handlePointerMove(e: PointerEvent) {
    if (!cardRef) return;
    const rect = cardRef.getBoundingClientRect();
    edgeProximity = getEdgeProximity(cardRef, e.clientX - rect.left, e.clientY - rect.top);
    cursorAngle = getCursorAngle(cardRef, e.clientX - rect.left, e.clientY - rect.top);
    const point = clampPoint(cardRef, e.clientX - rect.left, e.clientY - rect.top);
    markerX = point.x;
    markerY = point.y;
  }

  function handleMouseMove(e: MouseEvent) {
    if (!cardRef) return;
    const rect = cardRef.getBoundingClientRect();
    edgeProximity = getEdgeProximity(cardRef, e.clientX - rect.left, e.clientY - rect.top);
    cursorAngle = getCursorAngle(cardRef, e.clientX - rect.left, e.clientY - rect.top);
    const point = clampPoint(cardRef, e.clientX - rect.left, e.clientY - rect.top);
    markerX = point.x;
    markerY = point.y;
  }

  function handleEnter() {
    isHovered = true;
  }

  function handleLeave() {
    isHovered = false;
  }

  type AnimateOpts = {
    start?: number;
    end?: number;
    duration?: number;
    delay?: number;
    ease?: (t: number) => number;
    onUpdate: (v: number) => void;
    onEnd?: () => void;
  };

  function animateValue({
    start = 0,
    end = 100,
    duration = 1000,
    delay = 0,
    ease = easeOutCubic,
    onUpdate,
    onEnd
  }: AnimateOpts) {
    const t0 = performance.now() + delay;
    function tick() {
      const elapsed = performance.now() - t0;
      const t = Math.min(Math.max(elapsed / duration, 0), 1);
      onUpdate(start + (end - start) * ease(t));
      if (t < 1) requestAnimationFrame(tick);
      else onEnd?.();
    }
    setTimeout(() => requestAnimationFrame(tick), delay);
  }

  onMount(() => {
    cardRef = hostRef.closest<HTMLElement>('.has-border-glow');
    if (!cardRef) return;
    cardRadius = getComputedStyle(cardRef).borderRadius;
    updateMarkerFromAngle(cursorAngle);
    cardRef.addEventListener('pointermove', handlePointerMove, { passive: true });
    cardRef.addEventListener('mousemove', handleMouseMove, { passive: true });
    cardRef.addEventListener('pointerenter', handleEnter, { passive: true });
    cardRef.addEventListener('mouseenter', handleEnter, { passive: true });
    cardRef.addEventListener('pointerleave', handleLeave, { passive: true });
    cardRef.addEventListener('mouseleave', handleLeave, { passive: true });

    if (animated && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const angleStart = 110;
      const angleEnd = 485;
      sweepActive = true;
      cursorAngle = angleStart;
      animateValue({
        duration: 420,
        onUpdate: (v) => {
          edgeProximity = v / 100;
          markerScale = 0.72 + (v / 100) * 0.48;
        }
      });
      animateValue({
        ease: easeOutBack,
        duration: 2350,
        onUpdate: (v) => {
          cursorAngle = (angleEnd - angleStart) * (v / 100) + angleStart;
          updateMarkerFromAngle(cursorAngle);
        }
      });
      animateValue({
        ease: easeOutCubic,
        delay: 900,
        duration: 620,
        start: 120,
        end: 88,
        onUpdate: (v) => (markerScale = v / 100)
      });
      animateValue({
        ease: easeInCubic,
        delay: 2550,
        duration: 980,
        start: 100,
        end: 0,
        onUpdate: (v) => {
          edgeProximity = v / 100;
          markerScale = 0.72 + (v / 100) * 0.28;
        },
        onEnd: () => (sweepActive = false)
      });
    }

    return () => {
      cardRef?.removeEventListener('pointermove', handlePointerMove);
      cardRef?.removeEventListener('mousemove', handleMouseMove);
      cardRef?.removeEventListener('pointerenter', handleEnter);
      cardRef?.removeEventListener('mouseenter', handleEnter);
      cardRef?.removeEventListener('pointerleave', handleLeave);
      cardRef?.removeEventListener('mouseleave', handleLeave);
    };
  });

  const colorSensitivity = $derived(edgeSensitivity + 20);
  const isVisible = $derived(isHovered || sweepActive);
  const borderOpacity = $derived(
    isVisible ? Math.max(0, (edgeProximity * 100 - colorSensitivity) / (100 - colorSensitivity)) : 0
  );
  const glowOpacity = $derived(
    isVisible ? Math.max(0, (edgeProximity * 100 - edgeSensitivity) / (100 - edgeSensitivity)) : 0
  );
  const angleDeg = $derived(`${cursorAngle.toFixed(3)}deg`);
  const transitionStr = $derived(isVisible ? 'opacity 0.25s ease-out' : 'opacity 0.75s ease-in-out');
  const borderColor = $derived(buildHSLColor(glowColor, 0.95));
  const borderMask = $derived(
    `conic-gradient(from ${angleDeg} at center, black ${coneSpread}%, transparent ${coneSpread + 15}%, transparent ${100 - coneSpread - 15}%, black ${100 - coneSpread}%)`
  );
  const outerMask = $derived(
    `conic-gradient(from ${angleDeg} at center, black 2.5%, transparent 10%, transparent 90%, black 97.5%)`
  );
  const outerRadius = $derived(`calc(${cardRadius} + ${glowRadius}px)`);
  const markerOpacity = $derived(isVisible ? Math.max(glowOpacity, 0.82) : 0);
  const markerTransform = $derived(`translate(${markerX.toFixed(2)}px, ${markerY.toFixed(2)}px) translate(-50%, -50%) scale(${markerScale.toFixed(3)})`);
  const trailDots = $derived(
    [0, 1, 2, 3, 4, 5].map((index) => {
      const edgePoint = cardRef ? getPointAtAngle(cardRef, cursorAngle - index * 3.7) : { x: markerX, y: markerY };
      const point = cardRef ? clampPoint(cardRef, edgePoint.x, edgePoint.y) : edgePoint;
      return {
        x: point.x,
        y: point.y,
        size: Math.max(3, 9 - index),
        opacity: Math.max(0, markerOpacity * (0.72 - index * 0.1))
      };
    })
  );
</script>

<span bind:this={hostRef} class="border-glow" style="border-radius:{cardRadius};" aria-hidden="true">
  <span
    class="border-glow__border"
    style="border-color:{borderColor}; border-radius:{cardRadius}; opacity:{borderOpacity}; -webkit-mask-image:{borderMask}; mask-image:{borderMask}; transition:{transitionStr};"
  ></span>
  <span
    class="border-glow__outer"
    style="border-radius:{outerRadius}; inset:{-glowRadius}px; -webkit-mask-image:{outerMask}; mask-image:{outerMask}; opacity:{glowOpacity}; transition:{transitionStr};"
  >
    <span style="border-radius:{cardRadius}; inset:{glowRadius}px; box-shadow:{buildBoxShadow(glowColor, glowIntensity)};"></span>
  </span>
  <span class="border-glow__trail" style="opacity:{markerOpacity}; transition:{transitionStr};">
    {#each trailDots as dot}
      <span
        class="border-glow__trail-pixel"
        style="width:{dot.size}px; height:{dot.size}px; opacity:{dot.opacity}; transform:translate({dot.x.toFixed(2)}px, {dot.y.toFixed(2)}px) translate(-50%, -50%);"
      ></span>
    {/each}
  </span>
  <span class="border-glow__marker" style="opacity:{markerOpacity}; transform:{markerTransform}; transition:{transitionStr};"></span>
</span>

<style>
  .border-glow,
  .border-glow__border,
  .border-glow__outer,
  .border-glow__outer > span {
    position: absolute;
    border-radius: inherit;
    pointer-events: none;
  }

  .border-glow {
    inset: 0;
    z-index: 0;
  }

  .border-glow__border {
    inset: 0;
    border: 1px solid;
  }

  .border-glow__outer {
    z-index: 1;
    mix-blend-mode: plus-lighter;
  }

  .border-glow__outer > span {
    display: block;
  }

  .border-glow__trail,
  .border-glow__marker,
  .border-glow__trail-pixel {
    position: absolute;
    left: 0;
    top: 0;
    pointer-events: none;
  }

  .border-glow__trail {
    inset: 0;
    z-index: 3;
    filter: drop-shadow(0 0 8px rgb(255 126 24 / 0.54));
  }

  .border-glow__trail-pixel {
    border-radius: 1px;
    background: rgb(255 132 23);
    image-rendering: pixelated;
    will-change: transform, opacity;
  }

  .border-glow__marker {
    z-index: 4;
    width: 12px;
    height: 12px;
    border-radius: 3px;
    background:
      linear-gradient(90deg, rgb(255 157 42) 0 50%, rgb(255 121 18) 50% 100%);
    box-shadow:
      0 0 0 1px rgb(255 181 74 / 0.26),
      0 0 14px rgb(255 128 22 / 0.58);
    image-rendering: pixelated;
    will-change: transform, opacity;
  }
</style>
