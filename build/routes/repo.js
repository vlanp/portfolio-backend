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
import expressCache, { invalidateCache } from "../utils/expressCache.js";
import { getContent, getTags, getTree } from "../utils/github.js";
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
        invalidateCache("repo");
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
router.get("/repo/:repoid/tags", expressCache({
    dependencies: ["repo"],
    timeToLiveMin: 15,
}), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { repoid } = req.params;
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
        console.error(error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
}));
router.get("/repo/:repoid/docs/:sha", expressCache({
    dependencies: [],
    timeToLiveMin: 15,
}), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sha, repoid } = req.params;
        const repo = yield Repo.findById(repoid);
        if (!repo) {
            res.status(404).json({
                message: "No repo found with id " + repoid,
            });
            return;
        }
        const docsTree = yield getTree(repo, sha);
        const dirs = docsTree.data.tree.filter((item) => item.type === "tree");
        const files = docsTree.data.tree.filter((item) => item.type === "blob" && item.path.endsWith(".md"));
        const content = yield getContent(repo, files[0].path);
        res.status(200).json(content);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
}));
export default router;
