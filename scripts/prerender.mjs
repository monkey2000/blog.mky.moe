import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createServer } from "vite";

const root = process.cwd();
const rootOutputPath = resolve(root, "dist/index.html");
const vite = await createServer({
  appType: "custom",
  logLevel: "error",
  root,
  server: { middlewareMode: true },
});

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function outputPathForRoute(route) {
  if (route === "/") {
    return rootOutputPath;
  }

  return resolve(root, "dist", route.replace(/^\/+|\/+$/g, ""), "index.html");
}

try {
  const template = await readFile(rootOutputPath, "utf8");
  const { getPageTitle, render, routePaths } = await vite.ssrLoadModule("/src/entry-server.tsx");

  if (!template.includes("<!--app-html-->")) {
    throw new Error("SSR placeholder missing from built index.html");
  }

  for (const route of routePaths) {
    const outputPath = outputPathForRoute(route);
    const appHtml = render(route);
    const pageHtml = template
      .replace("<!--app-html-->", appHtml)
      .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(getPageTitle(route))}</title>`);

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, pageHtml);
  }
} finally {
  await vite.close();
}
