import type { ComponentType } from "react";
import DemoArticle, { frontmatter as demoFrontmatter } from "./interactive-mdx.mdx";

interface Frontmatter {
  date: Date | string;
  layout?: string;
  path?: string;
  tags?: string[] | string;
  title: string;
}

interface ContentModule {
  default: ComponentType;
  frontmatter: Frontmatter;
}

export interface Post {
  Component: ComponentType;
  date: Date;
  dateLabel: string;
  day: number;
  month: number;
  path: string;
  tags: string[];
  title: string;
  year: number;
}

export interface TagGroup {
  name: string;
  path: string;
  posts: Post[];
}

export type BlogRoute =
  | { kind: "home" }
  | { kind: "projects" }
  | { kind: "post"; post: Post }
  | { kind: "tags" }
  | { kind: "tag"; group: TagGroup }
  | { kind: "archives"; posts: Post[]; title: string }
  | { kind: "not-found" };

const contentModules = import.meta.glob<ContentModule>("/content/posts/**/*.md", {
  eager: true,
});

function normalizeDate(value: Date | string) {
  const source = value instanceof Date ? value.toISOString() : String(value);
  const match = source.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) {
    throw new Error(`Unsupported post date: ${source}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  return {
    date: new Date(Date.UTC(year, month - 1, day)),
    dateLabel: `${year}年${month}月${day}日`,
    day,
    month,
    year,
  };
}

export function normalizePath(pathname: string) {
  const pathWithoutQuery = pathname.split(/[?#]/, 1)[0] || "/";
  let decodedPath = pathWithoutQuery;

  try {
    decodedPath = decodeURI(pathWithoutQuery);
  } catch {
    // Keep the original path so malformed URLs resolve to the 404 page.
  }

  if (decodedPath === "/") {
    return "/";
  }

  return `/${decodedPath.replace(/^\/+|\/+$/g, "")}/`;
}

function pathFromContentFile(file: string) {
  const marker = "/content/posts/";
  const markerIndex = file.indexOf(marker);

  if (markerIndex === -1) {
    throw new Error(`Post is outside the expected content directory: ${file}`);
  }

  const relativePath = file.slice(markerIndex + marker.length).replace(/\.md$/, "");
  return normalizePath(`/${relativePath}/`);
}

function normalizeTags(tags: Frontmatter["tags"]) {
  if (!tags) {
    return [];
  }

  return Array.isArray(tags) ? tags : [tags];
}

function createPost(module: ContentModule, path: string): Post {
  const normalizedDate = normalizeDate(module.frontmatter.date);

  return {
    Component: module.default,
    path: normalizePath(path),
    tags: normalizeTags(module.frontmatter.tags),
    title: module.frontmatter.title,
    ...normalizedDate,
  };
}

const contentPosts = Object.entries(contentModules).map(([file, module]) =>
  createPost(module, pathFromContentFile(file)),
);
const demoPost = createPost(
  { default: DemoArticle, frontmatter: demoFrontmatter as Frontmatter },
  demoFrontmatter.path || "/mdx-demo/",
);

export const posts = [...contentPosts, demoPost].sort((left, right) =>
  right.date.getTime() - left.date.getTime(),
);

const postsByPath = new Map(posts.map((post) => [post.path, post]));

export function tagSlug(tag: string) {
  return tag.trim().replace(/\s+/g, "-");
}

const postsByTag = new Map<string, Post[]>();
for (const post of posts) {
  for (const tag of post.tags) {
    const taggedPosts = postsByTag.get(tag);
    if (taggedPosts) {
      taggedPosts.push(post);
    } else {
      postsByTag.set(tag, [post]);
    }
  }
}

export const tagGroups: TagGroup[] = [...postsByTag.entries()]
  .map(([name, taggedPosts]) => ({
    name,
    path: `/tags/${tagSlug(name)}/`,
    posts: taggedPosts,
  }))
  .sort((left, right) => left.name.localeCompare(right.name, "zh-CN"));

const tagsByPath = new Map(tagGroups.map((group) => [normalizePath(group.path), group]));
const archiveYears = [...new Set(posts.map((post) => post.year))].sort((left, right) => right - left);
const archiveMonths = [
  ...new Set(posts.map((post) => `${post.year}/${String(post.month).padStart(2, "0")}`)),
].sort((left, right) => right.localeCompare(left));

export const routePaths = [
  "/",
  "/tags/",
  "/projects/",
  "/archives/",
  ...posts.map((post) => post.path),
  ...tagGroups.map((group) => group.path),
  ...archiveYears.map((year) => `/archives/${year}/`),
  ...archiveMonths.map((month) => `/archives/${month}/`),
];

export function resolveRoute(pathname: string): BlogRoute {
  const path = normalizePath(pathname);

  if (path === "/") {
    return { kind: "home" };
  }
  if (path === "/tags/") {
    return { kind: "tags" };
  }
  if (path === "/projects/") {
    return { kind: "projects" };
  }
  if (path === "/archives/") {
    return { kind: "archives", posts, title: "Archives" };
  }

  const post = postsByPath.get(path);
  if (post) {
    return { kind: "post", post };
  }

  const tag = tagsByPath.get(path);
  if (tag) {
    return { kind: "tag", group: tag };
  }

  const archiveMatch = path.match(/^\/archives\/(\d{4})(?:\/(\d{2}))?\/$/);
  if (archiveMatch) {
    const year = Number(archiveMatch[1]);
    const month = archiveMatch[2] ? Number(archiveMatch[2]) : undefined;
    const archivedPosts = posts.filter(
      (entry) => entry.year === year && (month === undefined || entry.month === month),
    );

    if (archivedPosts.length > 0) {
      return {
        kind: "archives",
        posts: archivedPosts,
        title: month === undefined ? `Archives: ${year}` : `Archives: ${year}/${String(month).padStart(2, "0")}`,
      };
    }
  }

  return { kind: "not-found" };
}
