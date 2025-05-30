import express from "express";
import { Project, ZProjectIn, ZProjectOut, } from "../models/IProject.js";
import isAdmin from "../middlewares/isAdmin.js";
import { getContent, getDocsTree, getTags, } from "../utils/github.js";
import { isValidObjectId } from "mongoose";
import z from "zod/v4";
import { ZRepoOut } from "../models/IRepo.js";
const router = express.Router();
router.post("/project", isAdmin, async (req, res) => {
    if (!req.body) {
        res.responsesFunc.sendBadRequestResponse("Request body is missing.");
        return;
    }
    const projectInParseResult = ZProjectIn.safeParse(req.body);
    if (!projectInParseResult.success) {
        res.responsesFunc.sendBadRequestResponse(z.prettifyError(projectInParseResult.error));
        return;
    }
    const projectIn = projectInParseResult.data;
    const existingRepos = await Project.find({
        $or: projectIn.repos.map((repo) => ({
            "repos.owner": repo.owner,
            "repos.repo": repo.repo,
        })),
    });
    if (existingRepos.length > 0) {
        res.responsesFunc.sendBadRequestResponse("One or more Repos already exists");
        return;
    }
    const newDbProject = new Project(projectIn);
    const addedProjectDb = await newDbProject.save();
    res.responsesFunc.sendCreatedResponse(addedProjectDb, "Project added successfully into the database");
});
router.get("/projects", async (req, res) => {
    const dbProjects = await Project.find().lean();
    const projectsOutParseResults = dbProjects.map((dbProject) => ZProjectOut.safeParse(dbProject));
    const projectsOut = projectsOutParseResults
        .filter((result) => result.success)
        .map((result) => result.data);
    res.responsesFunc.sendOkResponse(projectsOut);
});
router.get("/repo/:repoid/tag/:sha", async (req, res) => {
    const { repoid, sha } = req.params;
    const { lang } = req.query;
    if (typeof lang !== "string") {
        res.responsesFunc.sendBadRequestResponse("lang query params must be a string");
        return;
    }
    if (!isValidObjectId(repoid)) {
        res.responsesFunc.sendBadRequestResponse("Invalid repo id");
        return;
    }
    const repo = (await Project.findOne({ "repos._id": repoid }, {
        "repos.$": 1,
        _id: 0,
    }))?.repos[0];
    if (!repo) {
        res.responsesFunc.sendNotFoundResponse("No repo found with id " + repoid);
        return;
    }
    const tags = await getTags(repo);
    const tag = tags.find((tag) => tag.commit.sha === sha);
    if (!tag) {
        res.responsesFunc.sendNotFoundResponse("No tag found with sha " + sha);
        return;
    }
    const docsTree = await getDocsTree(repo, tag.commit.sha);
    let langTree = docsTree.tree.filter((item) => item.path.startsWith("docs/" + lang + "/") ||
        item.path === "docs" + "/" + lang);
    if (langTree.length === 0) {
        langTree = docsTree.tree;
    }
    const dirs = langTree.filter((item) => item.type === "tree");
    const files = langTree.filter((item) => item.type === "blob" &&
        (item.path.endsWith(".md") || item.path.endsWith(".mdx")));
    const filesContentsPromises = files.map(async (file) => {
        const fileContent = await getContent(repo, file.path, tag.commit.sha);
        return { file, matterContent: fileContent.matterContent };
    });
    const filesContents = await Promise.all(filesContentsPromises);
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
    res.responsesFunc.sendOkResponse(tagContent);
});
router.get("/repo/:repoid", async (req, res) => {
    const { repoid } = req.params;
    if (!isValidObjectId(repoid)) {
        res.responsesFunc.sendBadRequestResponse("Invalid repo id");
        return;
    }
    const dbRepo = (await Project.findOne({ "repos._id": repoid }, {
        "repos.$": 1,
        _id: 0,
    }))?.repos[0];
    if (!dbRepo) {
        res.responsesFunc.sendNotFoundResponse("No repo found with id " + repoid);
        return;
    }
    const repoOutParseResult = ZRepoOut.safeParse(dbRepo);
    if (!repoOutParseResult.success) {
        throw new Error("Failed to parse and transform Repo from db into RepoOut.");
    }
    res.responsesFunc.sendOkResponse(repoOutParseResult.data);
});
router.get("/repo/:repoid/tags", async (req, res) => {
    const { repoid } = req.params;
    if (!isValidObjectId(repoid)) {
        res.responsesFunc.sendBadRequestResponse("Invalid repo id");
        return;
    }
    const repo = (await Project.findOne({ "repos._id": repoid }, {
        "repos.$": 1,
        _id: 0,
    }))?.repos[0];
    if (!repo) {
        res.responsesFunc.sendNotFoundResponse("No repo found with id " + repoid);
        return;
    }
    const tags = await getTags(repo);
    res.responsesFunc.sendOkResponse(tags);
});
router.get("/repo/:repoid/fileContent/:filepath", async (req, res) => {
    const { repoid, filepath } = req.params;
    const { ref } = req.query;
    if (typeof ref !== "string") {
        res.responsesFunc.sendBadRequestResponse("ref query params must be a string");
        return;
    }
    if (!isValidObjectId(repoid)) {
        res.responsesFunc.sendBadRequestResponse("Invalid repo id");
        return;
    }
    const repo = (await Project.findOne({ "repos._id": repoid }, {
        "repos.$": 1,
        _id: 0,
    }))?.repos[0];
    if (!repo) {
        res.responsesFunc.sendNotFoundResponse("No repo found with id " + repoid);
        return;
    }
    const fileContent = await getContent(repo, filepath, ref);
    if (!fileContent) {
        res.responsesFunc.sendNotFoundResponse("No file found with path " + filepath);
        return;
    }
    res.responsesFunc.sendOkResponse(fileContent);
});
router.get("/repo/:repoid/didFileExist/:filepath", async (req, res) => {
    const { repoid, filepath } = req.params;
    const { sha, lang } = req.query;
    if (typeof sha !== "string") {
        res.responsesFunc.sendBadRequestResponse("sha query params must be a string");
        return;
    }
    if (typeof lang !== "string") {
        res.responsesFunc.sendBadRequestResponse("lang query params must be a string");
        return;
    }
    if (!isValidObjectId(repoid)) {
        res.responsesFunc.sendBadRequestResponse("Invalid repo id");
        return;
    }
    const repo = (await Project.findOne({ "repos._id": repoid }, {
        "repos.$": 1,
        _id: 0,
    }))?.repos[0];
    if (!repo) {
        res.responsesFunc.sendNotFoundResponse("No repo found with id " + repoid);
        return;
    }
    const docsTree = await getDocsTree(repo, sha);
    const files = docsTree.tree.filter((item) => item.type === "blob" &&
        (item.path.endsWith(".md") || item.path.endsWith(".mdx")));
    const langFiles = files.filter((item) => item.path.startsWith("docs/" + lang + "/") ||
        item.path === "docs" + "/" + lang);
    if (langFiles.length === 0) {
        if (files.map((it) => it.path).includes(filepath)) {
            res.responsesFunc.sendOkResponse({
                exist: true,
            });
            return;
        }
    }
    else if (langFiles.map((it) => it.path).includes(filepath)) {
        res.responsesFunc.sendOkResponse({
            exist: true,
        });
        return;
    }
    else if (files.map((it) => it.path).includes(filepath)) {
        const filesContents = await Promise.all(files.map(async (it) => ({
            fileContent: await getContent(repo, it.path, sha),
            path: it.path,
        })));
        const id = filesContents.find((it) => it.path === filepath)?.fileContent
            .matterContent.id;
        if (id) {
            const langFilesContents = filesContents.filter((fileContent) => langFiles.map((it) => it.path).includes(fileContent.path));
            const fileInLang = langFilesContents.find((it) => it.fileContent.matterContent.id === id);
            if (fileInLang) {
                res.responsesFunc.sendOkResponse({
                    exist: true,
                    filePath: fileInLang.path,
                });
                return;
            }
        }
    }
    res.responsesFunc.sendOkResponse({
        exist: false,
    });
});
export default router;
