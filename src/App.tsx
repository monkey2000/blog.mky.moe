import { useEffect, useState } from "react";
import ProjectsContent from "../content/pages/projects.md";
import {
  posts,
  resolveRoute,
  tagGroups,
  tagSlug,
  type BlogRoute,
  type Post,
} from "@/content/posts";

const themeLabels = {
  system: "跟随系统",
  light: "浅色",
  dark: "深色",
} as const;
type ThemeMode = keyof typeof themeLabels;

function ThemeControl() {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    const savedMode = window.localStorage.getItem("blog-theme");
    if (savedMode === "system" || savedMode === "light" || savedMode === "dark") {
      setMode(savedMode);
    }
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    const lightStylesheet = document.getElementById("github-theme-light") as HTMLLinkElement | null;
    const darkStylesheet = document.getElementById("github-theme-dark") as HTMLLinkElement | null;

    if (mode === "system") {
      document.documentElement.removeAttribute("data-theme");
      if (lightStylesheet) lightStylesheet.media = "(prefers-color-scheme: light)";
      if (darkStylesheet) darkStylesheet.media = "(prefers-color-scheme: dark)";
    } else {
      document.documentElement.dataset.theme = mode;
      if (lightStylesheet) lightStylesheet.media = mode === "light" ? "all" : "not all";
      if (darkStylesheet) darkStylesheet.media = mode === "dark" ? "all" : "not all";
    }
    window.localStorage.setItem("blog-theme", mode);
  }, [mode, storageReady]);

  return (
    <button
      aria-label={`切换颜色模式，当前：${themeLabels[mode]}`}
      className="theme-toggle"
      onClick={() =>
        setMode((currentMode) =>
          currentMode === "system" ? "light" : currentMode === "light" ? "dark" : "system",
        )
      }
      type="button"
    >
      主题：{themeLabels[mode]}
    </button>
  );
}

function ArticleList({ entries }: { entries: Post[] }) {
  return entries.map((post) => (
    <article className="article-card" key={post.path}>
      <h3 className="article-head">
        <a href={post.path}>{post.title}</a>
      </h3>
      <p className="article-date">{post.dateLabel}</p>
    </article>
  ));
}

function HomePage() {
  return (
    <>
      <h1>zbaxrl&apos;s blog</h1>
      <p className="legacy-links">
        Links: <a href="/tags/">Tags</a> <a href="/projects/">Projects</a>{" "}
        <a href="/2021/friends_link/">Links</a> <a href="/2019/hello_world/">ReadMe</a>{" "}
        <a href="/archives/">Archives</a>
      </p>
      <ArticleList entries={posts} />
    </>
  );
}

function PostPage({ post }: { post: Post }) {
  const Content = post.Component;

  return (
    <>
      <h1>{post.title}</h1>
      {post.tags.length > 0 && (
        <p>
          Tags:{" "}
          {post.tags.map((tag, index) => (
            <span key={tag}>
              {index > 0 && " "}
              <a href={`/tags/${tagSlug(tag)}/`}>
                <span className="tag-code">{tag}</span>
              </a>
            </span>
          ))}
        </p>
      )}
      <Content />
    </>
  );
}

function TagsPage() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleGroups = normalizedQuery
    ? tagGroups.filter((group) => group.name.toLocaleLowerCase().includes(normalizedQuery))
    : tagGroups;

  return (
    <>
      <h2>Tags</h2>
      <div className="tag-search">
        <label htmlFor="tag-search-input">搜索标签</label>
        <input
          autoComplete="off"
          id="tag-search-input"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="输入标签名称"
          type="search"
          value={query}
        />
      </div>
      <p aria-live="polite" className="tag-search-summary">
        {normalizedQuery ? `找到 ${visibleGroups.length} 个标签` : `共 ${tagGroups.length} 个标签`}
      </p>
      {visibleGroups.length > 0 ? (
        <div className="tag-wall">
          {visibleGroups.map((group) => (
            <a className="tag-chip" href={group.path} key={group.name}>
              <span>{group.name}</span>
              <span aria-label={`${group.posts.length} 篇文章`} className="tag-chip-count">
                {group.posts.length}
              </span>
            </a>
          ))}
        </div>
      ) : (
        <p className="tag-search-empty">没有匹配的标签。</p>
      )}
    </>
  );
}

function RouteContent({ route }: { route: BlogRoute }) {
  if (route.kind === "home") {
    return <HomePage />;
  }
  if (route.kind === "post") {
    return <PostPage post={route.post} />;
  }
  if (route.kind === "tags") {
    return <TagsPage />;
  }
  if (route.kind === "projects") {
    return (
      <>
        <h1>Projects</h1>
        <ProjectsContent />
      </>
    );
  }
  if (route.kind === "tag") {
    return (
      <>
        <h2>{route.group.name}</h2>
        <ul>
          {route.group.posts.map((post) => (
            <li key={post.path}>
              <a href={post.path}>{post.title}</a>
            </li>
          ))}
        </ul>
      </>
    );
  }
  if (route.kind === "archives") {
    return (
      <>
        <h2>{route.title}</h2>
        <ArticleList entries={route.posts} />
      </>
    );
  }

  return (
    <>
      <h1>404</h1>
      <p>没有找到这个页面。返回 <a href="/">博客首页</a>。</p>
    </>
  );
}

function Footer() {
  return (
    <>
      <hr />
      <div className="row">
        <a href="https://creativecommons.org/licenses/by-nc-sa/3.0/" rel="license">
          <img
            alt="知识共享许可协议"
            className="license-image"
            src="https://i.creativecommons.org/l/by-nc-sa/3.0/80x15.png"
          />
        </a>{" "}
        2000 - 2099 MonKey&apos;s Blog | 自豪的采用 Vite + React + MDX + KaTeX
      </div>
    </>
  );
}

export function getPageTitle(path: string) {
  const route = resolveRoute(path);

  if (route.kind === "home") {
    return "zbaxrl's blog";
  }
  if (route.kind === "post") {
    return `${route.post.title} - zbaxrl's blog`;
  }
  if (route.kind === "tag") {
    return `${route.group.name} - zbaxrl's blog`;
  }
  if (route.kind === "archives") {
    return `${route.title} - zbaxrl's blog`;
  }
  if (route.kind === "tags") {
    return "Tags - zbaxrl's blog";
  }
  if (route.kind === "projects") {
    return "Projects - zbaxrl's blog";
  }
  return "404 - zbaxrl's blog";
}

export function App({ path = "/" }: { path?: string }) {
  const route = resolveRoute(path);

  useEffect(() => {
    document.title = getPageTitle(path);
  }, [path]);

  return (
    <div className="container markdown-body">
      <div className="site-tools">
        {route.kind !== "home" && <a href="/">Home</a>}
        <ThemeControl />
      </div>
      <RouteContent route={route} />
      <Footer />
    </div>
  );
}
