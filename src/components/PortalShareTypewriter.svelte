<script lang="ts">
  import { onMount } from "svelte";

  const prefix = "Share ";
  const sequence = ["the part that matters", "in a friendly format", "Frame"];
  const typeDelay = 36;
  const eraseDelay = 24;
  const lingerDelay = 1600;
  const finalLingerDelay = 4200;
  const prePortalDelay = 1350;

  let suffix = "";
  let index = 0;

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  onMount(() => {
    let cancelled = false;

    const run = async () => {
      while (!cancelled) {
        const word = sequence[index] ?? "";
        if (index === sequence.length - 1 && suffix.length === 0) {
          await sleep(prePortalDelay);
        }

        for (let i = 1; i <= word.length && !cancelled; i += 1) {
          suffix = word.slice(0, i);
          await sleep(typeDelay);
        }

        await sleep(index === sequence.length - 1 ? finalLingerDelay : lingerDelay);
        if (cancelled) return;

        if (index === sequence.length - 1) {
          while (suffix.length > 0 && !cancelled) {
            suffix = suffix.slice(0, -1);
            await sleep(eraseDelay);
          }
          index = 0;
          await sleep(700);
        } else {
          while (suffix.length > 0 && !cancelled) {
            suffix = suffix.slice(0, -1);
            await sleep(eraseDelay);
          }
          index += 1;
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  });
</script>

<span class="portal-typewriter" aria-live="polite">
  <span class="portal-typewriter__prefix">{prefix}</span><span class:list={["portal-typewriter__suffix", suffix === "Frame" && "portal-typewriter__suffix--portal"]}>{suffix}</span>
</span>
