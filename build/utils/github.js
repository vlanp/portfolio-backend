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
const octokit = new Octokit({
    auth: process.env.PUBLIC_RESOURCES_TOKEN,
});
const getTags = (repo) => __awaiter(void 0, void 0, void 0, function* () {
    const tags = yield octokit.rest.repos.listTags({
        owner: repo.owner,
        repo: repo.repo,
    });
    return tags;
});
const getTree = (repo, sha) => __awaiter(void 0, void 0, void 0, function* () {
    const tree = yield octokit.rest.git.getTree({
        owner: repo.owner,
        repo: repo.repo,
        tree_sha: sha,
        recursive: "true",
    });
    const docsItems = tree.data.tree.filter((item) => item.path.startsWith("docs/") || item.path === "docs");
    const result = Object.assign(Object.assign({}, tree), { data: Object.assign(Object.assign({}, tree.data), { tree: docsItems }) });
    return result;
});
export { getTags, getTree };
