export async function GET() {
  const baseUrl = "https://www.homewardtails.com";

  const staticPages = [
    "",
    "/adddescriptions",
    "/addnames",
    "/fetchusers",
    "/forgotpassword",
    "/login",
    "/magiclink",
    "/register",
  ];

  const urls = staticPages
    .map(
      (path) => `
  <url>
    <loc>${baseUrl}${path}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>`,
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset
    xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls}
  </urlset>`;

  return new Response(xml.trim(), {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
