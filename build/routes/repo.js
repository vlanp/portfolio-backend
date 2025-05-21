var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from "express";
import { Repo } from "../models/IRepo.js";
import isAdmin from "../middlewares/isAdmin.js";
import { getContent, getDocsTree, getTags } from "../utils/github.js";
import { isValidObjectId } from "mongoose";
const router = express.Router();
router.post("/repo", isAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.body) {
            res.status(400).json({
                message: "Request body is missing",
            });
            return;
        }
        const { displayName, owner, repo, path } = req.body;
        if (!displayName || !owner || !repo || !path) {
            res.status(400).json({
                message: "Missing required fields",
            });
            return;
        }
        if (typeof displayName !== "string") {
            res.status(400).json({
                message: "displayName must be a string",
            });
            return;
        }
        if (typeof owner !== "string") {
            res.status(400).json({
                message: "owner must be a string",
            });
            return;
        }
        if (typeof repo !== "string") {
            res.status(400).json({
                message: "repo must be a string",
            });
            return;
        }
        if (typeof path !== "string") {
            res.status(400).json({
                message: "path must be a string",
            });
            return;
        }
        const existingRepo = yield Repo.findOne({
            displayName,
            owner,
            repo,
            path,
        });
        if (existingRepo) {
            res.status(400).json({
                message: "Repo already exists",
            });
            return;
        }
        const newRepo = new Repo({
            displayName,
            owner,
            repo,
            path,
        });
        const createdRepo = yield newRepo.save();
        res.status(201).json({
            message: "Repo added successfully into the database",
            repo: createdRepo,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
}));
router.get("/repos", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const repos = yield Repo.find();
        res.status(200).json(repos);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
}));
router.get("/repo/:repoid/tag/:sha", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { repoid, sha } = req.params;
        const { lang } = req.query;
        if (typeof lang !== "string") {
            res.status(400).json({
                message: "lang query params must be a string",
            });
            return;
        }
        if (!isValidObjectId(repoid)) {
            res.status(400).json({
                message: "Invalid repo id",
            });
            return;
        }
        const repo = yield Repo.findById(repoid);
        if (!repo) {
            res.status(404).json({
                message: "No repo found with id " + repoid,
            });
            return;
        }
        const tags = yield getTags(repo);
        const tag = tags.find((tag) => tag.commit.sha === sha);
        if (!tag) {
            res.status(404).json({
                message: "No tag found with sha " + sha,
            });
            return;
        }
        const docsTree = yield getDocsTree(repo, tag.commit.sha);
        let langTree = docsTree.tree.filter((item) => item.path.startsWith("docs/" + lang + "/") ||
            item.path === "docs" + "/" + lang);
        if (langTree.length === 0) {
            langTree = docsTree.tree;
        }
        const dirs = langTree.filter((item) => item.type === "tree");
        const files = langTree.filter((item) => item.type === "blob" &&
            (item.path.endsWith(".md") || item.path.endsWith(".mdx")));
        const filesContentsPromises = files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
            const fileContent = yield getContent(repo, file.path, tag.commit.sha);
            return { file, matterContent: fileContent.matterContent };
        }));
        const filesContents = yield Promise.all(filesContentsPromises);
        const tagContent = {
            tag: tag,
            orderedTags: tags,
            orderedDirs: dirs
                .map((dir) => {
                const orderedFiles = filesContents
                    .filter((fileContent) => {
                    return (fileContent.file.path.split("/").slice(0, -1).join("/") ===
                        dir.path);
                })
                    .sort((a, b) => {
                    const navA = a.matterContent.nav;
                    const navB = b.matterContent.nav;
                    if (Number.isInteger(navA) && Number.isInteger(navB)) {
                        return navA - navB;
                    }
                    if (Number.isInteger(navA)) {
                        return -1;
                    }
                    if (Number.isInteger(navB)) {
                        return 1;
                    }
                    return 0;
                });
                return {
                    dir: dir,
                    orderedFiles: orderedFiles,
                };
            })
                .filter((dir) => dir.orderedFiles.length > 0)
                .sort((a, b) => {
                const navA = a.orderedFiles[0].matterContent.nav;
                const navB = b.orderedFiles[0].matterContent.nav;
                if (Number.isInteger(navA) && Number.isInteger(navB)) {
                    return navA - navB;
                }
                if (Number.isInteger(navA)) {
                    return -1;
                }
                if (Number.isInteger(navB)) {
                    return 1;
                }
                return 0;
            }),
        };
        res.status(200).json(tagContent);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
}));
router.get("/repo/:repoid", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { repoid } = req.params;
        if (!isValidObjectId(repoid)) {
            res.status(400).json({
                message: "Invalid repo id",
            });
            return;
        }
        const repo = yield Repo.findById(repoid);
        if (!repo) {
            res.status(404).json({
                message: "No repo found with id " + repoid,
            });
            return;
        }
        res.status(200).json(repo);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
}));
router.get("/repo/:repoid/tags", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { repoid } = req.params;
        if (!isValidObjectId(repoid)) {
            res.status(400).json({
                message: "Invalid repo id",
            });
            return;
        }
        const repo = yield Repo.findById(repoid);
        if (!repo) {
            res.status(404).json({
                message: "No repo found with id " + repoid,
            });
            return;
        }
        const tags = yield getTags(repo);
        res.status(200).json(tags);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
router.get("/repo/:repoid/fileContent/:filepath", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { repoid, filepath } = req.params;
        const { ref } = req.query;
        if (typeof ref !== "string") {
            res.status(400).json({
                message: "ref query params must be a string",
            });
            return;
        }
        if (!isValidObjectId(repoid)) {
            res.status(400).json({
                message: "Invalid repo id",
            });
            return;
        }
        const repo = yield Repo.findById(repoid);
        if (!repo) {
            res.status(404).json({
                message: "No repo found with id " + repoid,
            });
            return;
        }
        const fileContent = yield getContent(repo, filepath, ref);
        if (!fileContent) {
            res.status(404).json({
                message: "No file found with path " + filepath,
            });
            return;
        }
        res.status(200).json(fileContent);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
}));
router.get("/repo/:repoid/didFileExist/:filepath", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { repoid, filepath } = req.params;
        const { sha, lang } = req.query;
        if (typeof sha !== "string") {
            res.status(400).json({
                message: "sha query params must be a string",
            });
            return;
        }
        if (typeof lang !== "string") {
            res.status(400).json({
                message: "lang query params must be a string",
            });
            return;
        }
        if (!isValidObjectId(repoid)) {
            res.status(400).json({
                message: "Invalid repo id",
            });
            return;
        }
        const repo = yield Repo.findById(repoid);
        if (!repo) {
            res.status(404).json({
                message: "No repo found with id " + repoid,
            });
            return;
        }
        const docsTree = yield getDocsTree(repo, sha);
        const files = docsTree.tree.filter((item) => item.type === "blob" &&
            (item.path.endsWith(".md") || item.path.endsWith(".mdx")));
        const langFiles = files.filter((item) => item.path.startsWith("docs/" + lang + "/") ||
            item.path === "docs" + "/" + lang);
        if (langFiles.length === 0) {
            if (files.map((it) => it.path).includes(filepath)) {
                res.status(200).json({ exist: true });
                return;
            }
        }
        else if (langFiles.map((it) => it.path).includes(filepath)) {
            res.status(200).json({ exist: true });
            return;
        }
        else if (files.map((it) => it.path).includes(filepath)) {
            const filesContents = yield Promise.all(files.map((it) => __awaiter(void 0, void 0, void 0, function* () {
                return ({
                    fileContent: yield getContent(repo, it.path, sha),
                    path: it.path,
                });
            })));
            const id = (_a = filesContents.find((it) => it.path === filepath)) === null || _a === void 0 ? void 0 : _a.fileContent.matterContent.id;
            if (id) {
                const langFilesContents = filesContents.filter((fileContent) => langFiles.map((it) => it.path).includes(fileContent.path));
                const fileInLang = langFilesContents.find((it) => it.fileContent.matterContent.id === id);
                if (fileInLang) {
                    res.status(200).json({
                        exist: true,
                        filePath: fileInLang.path,
                    });
                    return;
                }
            }
        }
        res.status(200).json({ exist: false });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
}));
export default router;
