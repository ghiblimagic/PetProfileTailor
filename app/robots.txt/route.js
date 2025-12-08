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
