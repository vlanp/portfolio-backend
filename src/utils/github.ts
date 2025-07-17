import { Octokit } from "octokit";
import type { Octokit as OctokitType } from "octokit";
import checkedEnv from "./checkEnv.js";
import matter from "gray-matter";
import { LRUCache } from "lru-cache";
import stableStringify from "json-stable-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import { convertRelativeToAbsolutePaths } from "./convert.js";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import { rehypeAddClass, rehypeToc } from "./rehypeExtensions.js";
import IDocToC from "../models/IDocToc.js";
import remarkGfm from "remark-gfm";
import remarkGithubAlerts from "remark-github-alerts";
import { IDbRepo } from "../models/IRepo.js";
import { z } from "zod/v4";
import { IContent, IGrayMatterFile } from "../models/IMatter.js";
import rehypeExternalLinks from "rehype-external-links";
import rehypeMathjax from "rehype-mathjax";
import remarkMath from "remark-math";

type IOctokitContentResponse = Awaited<
  ReturnType<OctokitType["rest"]["repos"]["getContent"]>
>;

type IOctokitTagsResponse = Awaited<
  ReturnType<OctokitType["rest"]["repos"]["listTags"]>
>;

type IOctokitTreeResponse = Awaited<
  ReturnType<OctokitType["rest"]["git"]["getTree"]>
>;

const ZFrontMatterData = z.object({
  title: z.string(),
  description: z.string().optional(),
  nav: z.number().optional(),
  id: z.string().optional(),
});

type IFrontMatterData = z.infer<typeof ZFrontMatterData>;

const cacheOptions = {
  max: 100,
  ttl: 1000 * 60 * 60,
};

const tagsCache = new LRUCache<string, IOctokitTagsResponse["data"]>(
  cacheOptions
);
const treeCache = new LRUCache<string, IOctokitTreeResponse["data"]>(
  cacheOptions
);
const contentCache = new LRUCache<string, IContent<IFrontMatterData>>(
  cacheOptions
);

const octokit = new Octokit({
  auth: checkedEnv.GITHUB_READ_TOKEN,
});

const getTags = async (
  repo: IDbRepo
): Promise<IOctokitTagsResponse["data"]> => {
  const cacheKey = stableStringify(repo) + "/getTags";
  const cachedResult = tagsCache.get(cacheKey);
  if (cachedResult) {
    // console.log(`Cache hit for tags: ${cacheKey}`);
    return cachedResult;
  }
  const response = await octokit.rest.repos.listTags({
    owner: repo.owner,
    repo: repo.repo,
  });

  tagsCache.set(cacheKey, response.data);

  return response.data;
};

const getDocsTree = async (
  repo: IDbRepo,
  sha: string
): Promise<IOctokitTreeResponse["data"]> => {
  const cacheKey = stableStringify(repo) + "/getTree/" + sha;
  const cachedResult = treeCache.get(cacheKey);
  if (cachedResult) {
    // console.log(`Cache hit for tree: ${cacheKey}`);
    return cachedResult;
  }
  const response = await octokit.rest.git.getTree({
    owner: repo.owner,
    repo: repo.repo,
    tree_sha: sha,
    recursive: "true",
  });
  const docsItems = response.data.tree.filter(
    (item) => item.path.startsWith("docs/") || item.path === "docs"
  );
  const data = {
    ...response.data,
    tree: docsItems,
  };

  treeCache.set(cacheKey, data);

  return data;
};

const getContent = async (
  repo: IDbRepo,
  path: string,
  ref: string
): Promise<IContent<IFrontMatterData> | null> => {
  const cacheKey = stableStringify(repo) + "/getRawContent/" + path + "/" + ref;
  const cachedResult = contentCache.get(cacheKey);
  if (cachedResult) {
    // console.log(`Cache hit for raw content: ${cacheKey}`);
    return cachedResult;
  }
  const response = await octokit.rest.repos.getContent({
    owner: repo.owner,
    repo: repo.repo,
    path: path,
    ref,
    headers: { accept: "application/vnd.github.raw+json" },
  });
  if (typeof response.data !== "string") {
    throw new Error("Content is not a string");
  }
  const unsafeMatterContent = matter(response.data);

  const matterContentDataParseResult = ZFrontMatterData.safeParse(
    unsafeMatterContent.data
  );

  if (!matterContentDataParseResult.success) {
    return null;
  }

  const matterContent = {
    ...unsafeMatterContent,
    data: matterContentDataParseResult.data,
  };

  const tableOfContents: IDocToC[] = [];

  const processedContent = await unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(remarkGfm)
    .use(remarkGithubAlerts)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeHighlight)
    .use(rehypeMathjax, {
      svg: {
        scale: 1.2,
        minScale: 0.5,
        mtextInheritFont: true,
        merrorInheritFont: true,
        mathmlSpacing: false,
        fontCache: "global",
      },
    })
    .use(rehypeAddClass, {
      mapping: [
        { className: "basic-link", tagName: "a" },
        { className: "md-ul", tagName: "ul" },
      ],
    }) // Before rehypeAutolinkHeadings because we don't want the class in the headings
    .use(rehypeAutolinkHeadings, {
      behavior: "wrap",
      properties: {
        className: ["anchor-link"],
      },
    })
    .use(rehypeExternalLinks, {
      rel: ["nofollow", "noopener"],
      target: "_blank",
      content: {
        type: "element",
        tagName: "span",
        properties: { className: ["sr-only"] },
        children: [{ type: "text", value: " (opens in new window)" }],
      },
    })
    .use(rehypeToc(tableOfContents))
    .use(rehypeStringify)
    .process(matterContent.content);
  const contentHtml = convertRelativeToAbsolutePaths(
    processedContent.toString(),
    checkedEnv.BASE_GITHUB_RAW_URL +
      "/" +
      repo.owner +
      "/" +
      repo.repo +
      "/" +
      ref +
      "/" +
      path
  );
  const content: IContent<IFrontMatterData> = {
    htmlContent: contentHtml,
    matterContent: matterContent.data,
    tableOfContents,
  };
  contentCache.set(cacheKey, content);
  return content;
};

export { getTags, getDocsTree, getContent, ZFrontMatterData };
export type {
  IOctokitContentResponse,
  IOctokitTagsResponse,
  IOctokitTreeResponse,
  IGrayMatterFile,
  IFrontMatterData,
};
