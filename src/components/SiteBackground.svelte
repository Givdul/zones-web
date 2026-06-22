<script lang="ts">
  import Dither from './Dither.svelte';
</script>

<div class="site-background" aria-hidden="true">
  <Dither
    waveSpeed={0.02}
    waveFrequency={1.5}
    waveAmplitude={0.25}
    waveColor={[0.58, 0.72, 0.82]}
    colorNum={4}
    pixelSize={2}
    enableMouseInteraction={false}
    mouseRadius={0.1}
  />
</div>

<style>
  .site-background {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background:
      radial-gradient(circle at 16% 0%, rgb(255 255 255 / 0.12), transparent 30%),
      linear-gradient(145deg, var(--theme-canvas-top) 0%, var(--theme-canvas-bottom) 100%);
    opacity: 0.72;
  }

  .site-background::after {
    position: absolute;
    inset: 0;
    content: "";
    background:
      radial-gradient(ellipse at 50% 0%, rgb(180 211 231 / 0.14), transparent 42%),
      linear-gradient(180deg, rgb(20 20 21 / 0.1), rgb(20 20 21 / 0.5) 68%, rgb(20 20 21 / 0.78));
  }

  @media (max-width: 700px) {
    .site-background {
      opacity: 0.58;
    }
  }
</style>
