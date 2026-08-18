/// <reference types="@mdx-js/react" />

type BlogFrontmatter = {
  date: Date | string;
  layout?: string;
  path?: string;
  tags?: string[] | string;
  title: string;
};

declare module "*.mdx" {
  import type { ComponentType } from "react";
  export const frontmatter: BlogFrontmatter;
  const MDXComponent: ComponentType;
  export default MDXComponent;
}

declare module "*.md" {
  import type { ComponentType } from "react";
  export const frontmatter: BlogFrontmatter;
  const MarkdownComponent: ComponentType;
  export default MarkdownComponent;
}
