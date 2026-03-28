// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  site: process.env.PUBLIC_SITE_ORIGIN ?? 'https://apps.givdul.com',
});
