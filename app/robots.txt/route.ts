/**
 * robots.txt for crawlers.
 * Notes: docs/notes/app/robots-sitemap-routes.md
 */
export async function GET() {
  const content = `
User-agent: *
Allow: /
Disallow: /admin
Disallow: /protected
Sitemap: https://www.homewardtails.com/sitemap.xml
`;

  return new Response(content.trim(), {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
