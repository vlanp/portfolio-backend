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
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import { convertRelativeToAbsolutePaths } from "./convert.js";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import { rehypeToc } from "./rehypeToc.js";
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
    const cacheKey = stableStringify(repo) + "/getRawContent/" + path + "/" + ref;
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
    const tableOfContents = [];
    const processedContent = yield unified()
        .use(remarkParse)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(rehypeSlug)
        .use(rehypeHighlight)
        .use(rehypeAutolinkHeadings, {
        behavior: "wrap",
        properties: {
            className: ["anchor-link"],
        },
    })
        .use(rehypeToc(tableOfContents))
        .use(rehypeStringify)
        .process(matterContent.content);
    const contentHtml = convertRelativeToAbsolutePaths(processedContent.toString(), checkedEnv.BASE_GITHUB_RAW_URL +
        "/" +
        repo.owner +
        "/" +
        repo.repo +
        "/" +
        ref +
        "/" +
        path);
    const content = {
        htmlContent: contentHtml,
        matterContent: matterContent.data,
        tableOfContents,
    };
    contentCache.set(cacheKey, content);
    return content;
});
export { getTags, getDocsTree, getContent };
