/**
 * Static build for GitHub Pages → ./out
 * API routes (payment webhooks) and middleware need a server, so they are set aside during the export.
 */
import { execSync } from "node:child_process";
import { existsSync, renameSync, writeFileSync } from "node:fs";

const aside = [["app/api", ".pages-aside-api"], ["middleware.ts", ".pages-aside-middleware.ts"]];
for (const [from, to] of aside) if (existsSync(from)) renameSync(from, to);
try {
  execSync("next build", { stdio: "inherit", env: { ...process.env, GITHUB_PAGES: "1" } });
  writeFileSync("out/.nojekyll", ""); // let GitHub Pages serve the _next/ folder
} finally {
  for (const [from, to] of aside) if (existsSync(to)) renameSync(to, from);
}
