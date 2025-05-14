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
const contentCache = new LRUCache(cacheOptions);
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
    const response = yield octokit.rest.repos.listTags({
        owner: repo.owner,
        repo: repo.repo,
    });
    tagsCache.set(cacheKey, response.data);
    return response.data;
});
const getDocsTree = (repo, sha) => __awaiter(void 0, void 0, void 0, function* () {
    const cacheKey = stableStringify(repo) + "/getTree/" + sha;
    const cachedResult = treeCache.get(cacheKey);
    if (cachedResult) {
        console.log(`Cache hit for tree: ${cacheKey}`);
        return cachedResult;
    }
    const response = yield octokit.rest.git.getTree({
        owner: repo.owner,
        repo: repo.repo,
        tree_sha: sha,
        recursive: "true",
    });
    const docsItems = response.data.tree.filter((item) => item.path.startsWith("docs/") || item.path === "docs");
    const data = Object.assign(Object.assign({}, response.data), { tree: docsItems });
    treeCache.set(cacheKey, data);
    return data;
});
const getContent = (repo, path, ref) => __awaiter(void 0, void 0, void 0, function* () {
    const cacheKey = stableStringify(repo) + "/getRawContent/" + path + (ref ? "/" + ref : "");
    const cachedResult = contentCache.get(cacheKey);
    if (cachedResult) {
        console.log(`Cache hit for raw content: ${cacheKey}`);
        return cachedResult;
    }
    const response = yield octokit.rest.repos.getContent({
        owner: repo.owner,
        repo: repo.repo,
        path: path,
        ref,
        headers: { accept: "application/vnd.github.raw+json" },
    });
    if (typeof response.data !== "string") {
        throw new Error("Content is not a string");
    }
    const matterContent = matter(response.data);
    const processedContent = yield remark()
        .use(html)
        .process(matterContent.content);
    const contentHtml = processedContent.toString();
    const content = {
        htmlContent: contentHtml,
        matterContent: matterContent.data,
    };
    contentCache.set(cacheKey, content);
    return content;
});
export { getTags, getDocsTree, getContent };
