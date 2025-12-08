import fs from "fs";
import path from "path";

const appDir = path.join(process.cwd(), "app");

function getRoutes(dir = appDir, basePath = "") {
  let routes = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subdir = path.join(dir, entry.name);
      const routePath = path.join(basePath, entry.name);

      // If this folder has a page.js, treat it as a route
      if (
        fs.existsSync(path.join(subdir, "page.js")) ||
        fs.existsSync(path.join(subdir, "page.tsx"))
      ) {
        routes.push(`/${routePath}`.replace(/\\/g, "/"));
      }

      // Recurse
      routes = routes.concat(getRoutes(subdir, routePath));
    }
  }
  return routes;
}

const staticRoutes = getRoutes().sort();

console.log("Static routes:");
console.log(staticRoutes.join("\n"));

// Optional: write to JSON or text file
fs.writeFileSync("staticRoutes.json", JSON.stringify(staticRoutes, null, 2));
