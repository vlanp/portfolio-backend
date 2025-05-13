var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Octokit } from "octokit";
import checkedEnv from "./checkEnv.js";
import matter from "gray-matter";
import { LRUCache } from "lru-cache";
import stableStringify from "json-stable-stringify";
import { remark } from "remark";
import html from "remark-html";
const cacheOptions = {
    max: 100,
    ttl: 1000 * 60 * 60,
};
const tagsCache = new LRUCache(cacheOptions);
const treeCache = new LRUCache(cacheOptions);
const rawContentCache = new LRUCache(cacheOptions);
const matterContentCache = new LRUCache(cacheOptions);
const htmlContentCache = new LRUCache(cacheOptions);
const octokit = new Octokit({
    auth: checkedEnv.GITHUB_READ_TOKEN,
});
const getTags = (repo) => __awaiter(void 0, void 0, void 0, function* () {
    const cacheKey = stableStringify(repo) + "/getTags";
    const cachedResult = tagsCache.get(cacheKey);
    if (cachedResult) {
        console.log(`Cache hit for tags: ${cacheKey}`);
        return cachedResult;
    }
    const result = yield octokit.rest.repos.listTags({
        owner: repo.owner,
        repo: repo.repo,
    });
    tagsCache.set(cacheKey, result);
    return result;
});
const getTree = (repo, sha) => __awaiter(void 0, void 0, void 0, function* () {
    const cacheKey = stableStringify(repo) + "/getTree/" + sha;
    const cachedResult = treeCache.get(cacheKey);
    if (cachedResult) {
        console.log(`Cache hit for tree: ${cacheKey}`);
        return cachedResult;
    }
    const tree = yield octokit.rest.git.getTree({
        owner: repo.owner,
        repo: repo.repo,
        tree_sha: sha,
        recursive: "true",
    });
    const docsItems = tree.data.tree.filter((item) => item.path.startsWith("docs/") || item.path === "docs");
    const result = Object.assign(Object.assign({}, tree), { data: Object.assign(Object.assign({}, tree.data), { tree: docsItems }) });
    treeCache.set(cacheKey, result);
    return result;
});
const getRawContent = (repo, path) => __awaiter(void 0, void 0, void 0, function* () {
    const cacheKey = stableStringify(repo) + "/getRawContent/" + path;
    const cachedResult = rawContentCache.get(cacheKey);
    if (cachedResult) {
        console.log(`Cache hit for raw content: ${cacheKey}`);
        return cachedResult;
    }
    const result = yield octokit.rest.repos.getContent({
        owner: repo.owner,
        repo: repo.repo,
        path: path,
        headers: { accept: "application/vnd.github.raw+json" },
    });
    rawContentCache.set(cacheKey, result);
    return result;
});
const getMatterContent = (repo, path) => __awaiter(void 0, void 0, void 0, function* () {
    const cacheKey = stableStringify(repo) + "/getMatterContent/" + path;
    const cachedResult = matterContentCache.get(cacheKey);
    if (cachedResult) {
        console.log(`Cache hit for matter content: ${cacheKey}`);
        return cachedResult;
    }
    const rawContent = yield getRawContent(repo, path);
    if (typeof rawContent.data !== "string") {
        rawContentCache.delete(stableStringify(repo) + "/getRawContent/" + path);
        throw new Error("Content is not a string");
    }
    const matterContent = matter(rawContent.data);
    matterContentCache.set(cacheKey, matterContent);
    return matterContent;
});
const getHtmlContent = (repo, path) => __awaiter(void 0, void 0, void 0, function* () {
    const cacheKey = stableStringify(repo) + "/getHtmlContent/" + path;
    const cachedResult = htmlContentCache.get(cacheKey);
    if (cachedResult) {
        console.log(`Cache hit for HTML content: ${cacheKey}`);
        return cachedResult;
    }
    const matterContent = yield getMatterContent(repo, path);
    const processedContent = yield remark()
        .use(html)
        .process(matterContent.content);
    const contentHtml = processedContent.toString();
    htmlContentCache.set(cacheKey, contentHtml);
    return contentHtml;
});
export { getTags, getTree, getRawContent, getMatterContent, getHtmlContent };
