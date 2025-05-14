import express from "express";
import { IRepo, Repo } from "../models/IRepo.js";
import isAdmin from "../middlewares/isAdmin.js";
import { getContent, getDocsTree, getTags } from "../utils/github.js";
import { ITagContent } from "../models/ITagContent.js";
import { isValidObjectId } from "mongoose";

const router = express.Router();

router.post("/repo", isAdmin, async (req, res) => {
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

    const existingRepo = await Repo.findOne({
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

    const newRepo = new Repo<IRepo>({
      displayName,
      owner,
      repo,
      path,
    });

    const createdRepo = await newRepo.save();

    res.status(201).json({
      message: "Repo added successfully into the database",
      repo: createdRepo,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.get("/repos", async (req, res) => {
  try {
    const repos = await Repo.find();
    res.status(200).json(repos);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.get("/repo/:repoid/lastTag", async (req, res) => {
  try {
    const { repoid } = req.params;
    if (!isValidObjectId(repoid)) {
      res.status(400).json({
        message: "Invalid repo id",
      });
      return;
    }
    const repo = await Repo.findById(repoid);
    if (!repo) {
      res.status(404).json({
        message: "No repo found with id " + repoid,
      });
      return;
    }
    const tags = await getTags(repo);
    const lastTag = tags[0];
    if (!lastTag) {
      res.status(404).json({
        message: "No tags found for this repo",
      });
      return;
    }
    const docsTree = await getDocsTree(repo, lastTag.commit.sha);
    const dirs = docsTree.tree.filter((item) => item.type === "tree");
    const files = docsTree.tree.filter(
      (item) => item.type === "blob" && item.path.endsWith(".md")
    );
    const contentsPromises = files.map(async (file) => {
      const content = await getContent(repo, file.path);
      return { file, content };
    });
    const contents = await Promise.all(contentsPromises);
    const lastTagContent: ITagContent = {
      tag: lastTag,
      orderedTags: tags,
      orderedDirs: dirs
        .map((dir) => {
          const orderedFiles = contents
            .filter((content) => {
              if (!content.content) {
                console.log(content);
              }

              const dirPath = content.file.path
                .split("/")
                .slice(0, -1)
                .join("/");
              return dirPath === dir.path;
            })
            .sort((a, b) => {
              const navA = a.content.matterContent.nav;
              const navB = b.content.matterContent.nav;
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
          const navA = a.orderedFiles[0].content.matterContent.nav;
          const navB = b.orderedFiles[0].content.matterContent.nav;
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

    res.status(200).json(lastTagContent);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.get("/repo/:repoid/tag/:sha", async (req, res) => {
  try {
    const { repoid, sha } = req.params;
    if (!isValidObjectId(repoid)) {
      res.status(400).json({
        message: "Invalid repo id",
      });
      return;
    }
    const repo = await Repo.findById(repoid);
    if (!repo) {
      res.status(404).json({
        message: "No repo found with id " + repoid,
      });
      return;
    }
    const tags = await getTags(repo);
    const tag = tags.find((tag) => tag.commit.sha === sha);
    if (!tag) {
      res.status(404).json({
        message: "No tag found with sha " + sha,
      });
      return;
    }
    const docsTree = await getDocsTree(repo, tag.commit.sha);
    const dirs = docsTree.tree.filter((item) => item.type === "tree");
    const files = docsTree.tree.filter(
      (item) => item.type === "blob" && item.path.endsWith(".md")
    );
    const contentsPromises = files.map(async (file) => {
      const content = await getContent(repo, file.path);
      return { file, content };
    });
    const contents = await Promise.all(contentsPromises);
    const lastTagContent: ITagContent = {
      tag: tag,
      orderedTags: tags,
      orderedDirs: dirs
        .map((dir) => {
          const orderedFiles = contents
            .filter((content) => {
              if (!content.content) {
                console.log(content);
              }

              const dirPath = content.file.path
                .split("/")
                .slice(0, -1)
                .join("/");
              return dirPath === dir.path;
            })
            .sort((a, b) => {
              const navA = a.content.matterContent.nav;
              const navB = b.content.matterContent.nav;
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
          const navA = a.orderedFiles[0].content.matterContent.nav;
          const navB = b.orderedFiles[0].content.matterContent.nav;
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

    res.status(200).json(lastTagContent);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.get("/repo/:repoid", async (req, res) => {
  try {
    const { repoid } = req.params;
    if (!isValidObjectId(repoid)) {
      res.status(400).json({
        message: "Invalid repo id",
      });
      return;
    }
    const repo = await Repo.findById(repoid);
    if (!repo) {
      res.status(404).json({
        message: "No repo found with id " + repoid,
      });
      return;
    }
    res.status(200).json(repo);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

export default router;
