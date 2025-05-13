import { Octokit } from "octokit";
import type { Octokit as OctokitType } from "octokit";
import { IRepo } from "../models/IRepo.js";
import checkedEnv from "./checkEnv.js";
import matter, { GrayMatterFile } from "gray-matter";
import { LRUCache } from "lru-cache";
import stableStringify from "json-stable-stringify";
import { remark } from "remark";
import html from "remark-html";
import { get } from "mongoose";

type IOctokitContentResponse = Awaited<
  ReturnType<OctokitType["rest"]["repos"]["getContent"]>
>;

type IOctokitTagsResponse = Awaited<
  ReturnType<OctokitType["rest"]["repos"]["listTags"]>
>;

type IOctokitTreeResponse = Awaited<
  ReturnType<OctokitType["rest"]["git"]["getTree"]>
>;

const cacheOptions = {
  max: 100,
  ttl: 1000 * 60 * 60,
};

const tagsCache = new LRUCache<string, IOctokitTagsResponse>(cacheOptions);
const treeCache = new LRUCache<string, IOctokitTreeResponse>(cacheOptions);
const rawContentCache = new LRUCache<string, IOctokitContentResponse>(
  cacheOptions
);
const matterContentCache = new LRUCache<string, GrayMatterFile<never>>(
  cacheOptions
);
const htmlContentCache = new LRUCache<string, string>(cacheOptions);

const octokit = new Octokit({
  auth: checkedEnv.GITHUB_READ_TOKEN,
});

const getTags = async (repo: IRepo): Promise<IOctokitTagsResponse> => {
  const cacheKey = stableStringify(repo) + "/getTags";
  const cachedResult = tagsCache.get(cacheKey);
  if (cachedResult) {
    console.log(`Cache hit for tags: ${cacheKey}`);
    return cachedResult;
  }
  const result = await octokit.rest.repos.listTags({
    owner: repo.owner,
    repo: repo.repo,
  });

  tagsCache.set(cacheKey, result);

  return result;
};

const getTree = async (
  repo: IRepo,
  sha: string
): Promise<IOctokitTreeResponse> => {
  const cacheKey = stableStringify(repo) + "/getTree/" + sha;
  const cachedResult = treeCache.get(cacheKey);
  if (cachedResult) {
    console.log(`Cache hit for tree: ${cacheKey}`);
    return cachedResult;
  }
  const tree = await octokit.rest.git.getTree({
    owner: repo.owner,
    repo: repo.repo,
    tree_sha: sha,
    recursive: "true",
  });
  const docsItems = tree.data.tree.filter(
    (item) => item.path.startsWith("docs/") || item.path === "docs"
  );

  const result = {
    ...tree,
    data: {
      ...tree.data,
      tree: docsItems,
    },
  };

  treeCache.set(cacheKey, result);

  return result;
};

const getRawContent = async (
  repo: IRepo,
  path: string
): Promise<IOctokitContentResponse> => {
  const cacheKey = stableStringify(repo) + "/getRawContent/" + path;
  const cachedResult = rawContentCache.get(cacheKey);
  if (cachedResult) {
    console.log(`Cache hit for raw content: ${cacheKey}`);
    return cachedResult;
  }
  const result = await octokit.rest.repos.getContent({
    owner: repo.owner,
    repo: repo.repo,
    path: path,
    headers: { accept: "application/vnd.github.raw+json" },
  });
  rawContentCache.set(cacheKey, result);
  return result;
};

const getMatterContent = async (
  repo: IRepo,
  path: string
): Promise<GrayMatterFile<never>> => {
  const cacheKey = stableStringify(repo) + "/getMatterContent/" + path;
  const cachedResult = matterContentCache.get(cacheKey);
  if (cachedResult) {
    console.log(`Cache hit for matter content: ${cacheKey}`);
    return cachedResult;
  }
  const rawContent = await getRawContent(repo, path);
  if (typeof rawContent.data !== "string") {
    rawContentCache.delete(stableStringify(repo) + "/getRawContent/" + path);
    throw new Error("Content is not a string");
  }
  const matterContent = matter(rawContent.data);
  matterContentCache.set(cacheKey, matterContent);
  return matterContent;
};

const getHtmlContent = async (repo: IRepo, path: string): Promise<string> => {
  const cacheKey = stableStringify(repo) + "/getHtmlContent/" + path;
  const cachedResult = htmlContentCache.get(cacheKey);
  if (cachedResult) {
    console.log(`Cache hit for HTML content: ${cacheKey}`);
    return cachedResult;
  }
  const matterContent = await getMatterContent(repo, path);
  const processedContent = await remark()
    .use(html)
    .process(matterContent.content);
  const contentHtml = processedContent.toString();
  htmlContentCache.set(cacheKey, contentHtml);
  return contentHtml;
};

export { getTags, getTree, getRawContent, getMatterContent, getHtmlContent };
export type {
  IOctokitContentResponse,
  IOctokitTagsResponse,
  IOctokitTreeResponse,
};
