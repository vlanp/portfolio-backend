import { Octokit } from "octokit";
import type { Octokit as OctokitType } from "octokit";
import { IRepo } from "../models/IRepo.js";
import checkedEnv from "./checkEnv.js";
import matter, { GrayMatterFile } from "gray-matter";
import { LRUCache } from "lru-cache";
import stableStringify from "json-stable-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import { convertRelativeToAbsolutePaths } from "./convert.js";

type IOctokitContentResponse = Awaited<
  ReturnType<OctokitType["rest"]["repos"]["getContent"]>
>;

type IOctokitTagsResponse = Awaited<
  ReturnType<OctokitType["rest"]["repos"]["listTags"]>
>;

type IOctokitTreeResponse = Awaited<
  ReturnType<OctokitType["rest"]["git"]["getTree"]>
>;

interface IFrontMatterData {
  title: string;
  description: string;
  nav: number;
}

type IGrayMatterFile<H> = GrayMatterFile<string> & {
  data: H;
};

interface IContent {
  htmlContent: string;
  matterContent: IGrayMatterFile<IFrontMatterData>["data"];
}

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
const contentCache = new LRUCache<string, IContent>(cacheOptions);

const octokit = new Octokit({
  auth: checkedEnv.GITHUB_READ_TOKEN,
});

const getTags = async (repo: IRepo): Promise<IOctokitTagsResponse["data"]> => {
  const cacheKey = stableStringify(repo) + "/getTags";
  const cachedResult = tagsCache.get(cacheKey);
  if (cachedResult) {
    console.log(`Cache hit for tags: ${cacheKey}`);
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
  repo: IRepo,
  sha: string
): Promise<IOctokitTreeResponse["data"]> => {
  const cacheKey = stableStringify(repo) + "/getTree/" + sha;
  const cachedResult = treeCache.get(cacheKey);
  if (cachedResult) {
    console.log(`Cache hit for tree: ${cacheKey}`);
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
  repo: IRepo,
  path: string,
  ref: string
): Promise<IContent> => {
  const cacheKey = stableStringify(repo) + "/getRawContent/" + path + "/" + ref;
  const cachedResult = contentCache.get(cacheKey);
  if (cachedResult) {
    console.log(`Cache hit for raw content: ${cacheKey}`);
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
  const matterContent = matter(
    response.data
  ) as IGrayMatterFile<IFrontMatterData>;
  const processedContent = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
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
  const content: IContent = {
    htmlContent: contentHtml,
    matterContent: matterContent.data,
  };
  contentCache.set(cacheKey, content);
  return content;
};

export { getTags, getDocsTree, getContent };
export type {
  IOctokitContentResponse,
  IOctokitTagsResponse,
  IOctokitTreeResponse,
  IContent,
  IGrayMatterFile,
  IFrontMatterData,
};
