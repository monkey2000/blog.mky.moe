import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { render } from "./entry-server";

const renderRoute = render as unknown as (path: string) => string;
const documentShell = readFileSync(new URL("../index.html", import.meta.url), "utf8");

describe("blog SSR routes", () => {
  it("renders the interactive MDX demo with KaTeX", () => {
    const html = renderRoute("/mdx-demo/");

    expect(html).toContain("data-testid=\"mdx-counter\"");
    expect(html).toContain("Increase signal");
    expect(html).toContain("class=\"katex\"");
    expect(html).toContain("katex-display");
  });

  it("renders the homepage links and complete article list", () => {
    const html = renderRoute("/");

    expect(html).toContain("zbaxrl&#x27;s blog");
    expect(html).toContain('href="/tags/"');
    expect(html).toContain('href="/projects/"');
    expect(html).toContain('href="/2021/friends_link/"');
    expect(html).toContain('href="/2019/hello_world/"');
    expect(html).toContain("在 Hetzner 上配置 NixOS RAIDZ 全盘加密");
    expect(html).toContain("MIT 6.828 - 10. Lab 10: network");
  });

  it("renders an old post at its original URL", () => {
    const html = renderRoute("/2019/hello_world/");

    expect(html).toContain("<h1>你好世界</h1>");
    expect(html).toContain("Tags:");
    expect(html).toContain("class=\"katex-display\"");
    expect(html).toContain("src=\"smile_photo.jpg\"");
    expect(html).toContain('class="shiki shiki-themes github-light github-dark"');
    expect(html).toContain("--shiki-dark:");
  });

  it("renders the migrated projects page", () => {
    const html = renderRoute("/projects/");

    expect(html).toContain("<h1>Projects</h1>");
    expect(html).toContain('href="/mit6828/menu"');
    expect(html).toContain('href="/mit6814/menu"');
  });

  it("renders searchable tags without article lists", () => {
    const html = renderRoute("/tags/");

    expect(html).toContain("<h2>Tags</h2>");
    expect(html).toContain('type="search"');
    expect(html).toContain('class="tag-wall"');
    expect(html).toContain('href="/tags/MIT-6.828/"');
    expect(html).not.toContain('class="tag-preview"');
    expect(html).not.toContain("MIT 6.828 - 10. Lab 10: network");
  });

  it("defaults to system colors and exposes a theme toggle", () => {
    const html = renderRoute("/");

    expect(html).toContain("aria-label=\"切换颜色模式，当前：跟随系统\"");
    expect(documentShell).toContain('id="github-theme-light"');
    expect(documentShell).toContain('id="github-theme-dark"');
  });
});
