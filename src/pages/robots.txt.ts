import { site } from "../data/site";

export const prerender = true;

export function GET() {
  const sitemapUrl = new URL("/sitemap.xml", site.origin).toString();

  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
