// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import svelte from '@astrojs/svelte';

/** @type {{ env?: Record<string, string | undefined> } | undefined} */
const processRef = /** @type {{ process?: { env?: Record<string, string | undefined> } }} */ (globalThis).process;

// https://astro.build/config
export default defineConfig({
  integrations: [react(), svelte()],
  site: processRef?.env?.PUBLIC_SITE_ORIGIN ?? 'https://apps.givdul.com',
});
