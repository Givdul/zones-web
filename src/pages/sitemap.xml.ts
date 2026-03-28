import { apps, site } from "../data/site";

export const prerender = true;

const paths = [
  "/",
  ...apps.flatMap((app) => [app.landingPath, app.supportPath, app.privacyPath]),
];

export function GET() {
  const urls = paths
    .map((path) => {
      const location = new URL(path, site.origin).toString();
      return `<url><loc>${location}</loc></url>`;
    })
    .join("");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
      },
    },
  );
}
