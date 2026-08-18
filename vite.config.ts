import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import type { Root, RootContent } from "mdast";
import rehypeShiki from "@shikijs/rehype";
import rehypeKatex from "rehype-katex";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { visit } from "unist-util-visit";
import type { VFile } from "vfile";
import { defineConfig, type Plugin } from "vite";

interface StaticAsset {
  fileName: string;
  source: Buffer | string;
}

const projectRoot = import.meta.dirname;
const require = createRequire(import.meta.url);

function collectPostAssets(directory: string, relativeDirectory = ""): StaticAsset[] {
  const assets: StaticAsset[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const relativePath = path.posix.join(relativeDirectory, entry.name);
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      assets.push(...collectPostAssets(absolutePath, relativePath));
    } else if (!entry.name.endsWith(".md")) {
      assets.push({ fileName: relativePath, source: readFileSync(absolutePath) });
    }
  }

  return assets;
}

function contentType(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  const types: Record<string, string> = {
    ".css": "text/css; charset=utf-8",
    ".gif": "image/gif",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
  };

  return types[extension] || "application/octet-stream";
}

function staticBlogAssets(): Plugin {
  const themeAssets: StaticAsset[] = [
    {
      fileName: "styles/github-markdown-light.css",
      source: readFileSync(require.resolve("github-markdown-css/github-markdown-light.css"), "utf8"),
    },
    {
      fileName: "styles/github-markdown-dark.css",
      source: readFileSync(require.resolve("github-markdown-css/github-markdown-dark.css"), "utf8"),
    },
  ];
  const postAssets = collectPostAssets(path.join(projectRoot, "content/posts"));
  const assets = [...themeAssets, ...postAssets];
  const assetByPath = new Map(assets.map((asset) => [`/${asset.fileName}`, asset]));

  return {
    name: "static-blog-assets",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (!request.url) {
          next();
          return;
        }

        let requestPath = new URL(request.url, "http://vite.local").pathname;
        try {
          requestPath = decodeURI(requestPath);
        } catch {
          next();
          return;
        }

        const asset = assetByPath.get(requestPath);
        if (!asset) {
          next();
          return;
        }

        response.statusCode = 200;
        response.setHeader("Content-Type", contentType(asset.fileName));
        response.end(asset.source);
      });
    },
    generateBundle() {
      for (const asset of assets) {
        this.emitFile({
          type: "asset",
          fileName: asset.fileName,
          source: asset.source,
        });
      }
    },
  };
}

function remarkLegacyDisplayMath() {
  return (tree: Root, file: VFile) => {
    const source = String(file);

    visit(tree, "paragraph", (node, index, parent) => {
      if (index === undefined || !parent || node.children.length !== 1) {
        return;
      }

      const child = node.children[0];
      const start = child.position?.start.offset;
      const end = child.position?.end.offset;
      if (child.type !== "inlineMath" || start === undefined || end === undefined) {
        return;
      }

      const original = source.slice(start, end).trim();
      if (!original.startsWith("$$") || !original.endsWith("$$")) {
        return;
      }

      (parent.children as RootContent[])[index] = {
        type: "math",
        value: child.value,
        position: node.position,
        data: {
          hName: "pre",
          hChildren: [
            {
              type: "element",
              tagName: "code",
              properties: { className: ["language-math", "math-display"] },
              children: [{ type: "text", value: child.value }],
            },
          ],
        },
      };
    });
  };
}

export default defineConfig({
  plugins: [
    {
      enforce: "pre",
      ...mdx({
        remarkPlugins: [
          remarkFrontmatter,
          remarkMdxFrontmatter,
          remarkGfm,
          remarkMath,
          remarkLegacyDisplayMath,
        ],
        rehypePlugins: [
          rehypeKatex,
          [
            rehypeShiki,
            {
              defaultLanguage: "text",
              fallbackLanguage: "text",
              lazy: true,
              themes: {
                light: "github-light",
                dark: "github-dark",
              },
            },
          ],
        ],
      }),
    },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    staticBlogAssets(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(projectRoot, "./src"),
    },
  },
});
