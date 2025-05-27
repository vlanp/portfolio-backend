import express from "express";
import { IProjectIn, Project, ZProjectIn } from "../models/IProject.js";
import isAdmin from "../middlewares/isAdmin.js";
import { getContent, getDocsTree, getTags } from "../utils/github.js";
import { ITagContent } from "../models/ITagContent.js";
import { isValidObjectId } from "mongoose";
import z, { ZodSafeParseResult } from "zod/v4";

const router = express.Router();

router.post("/project", isAdmin, async (req, res) => {
  try {
    if (!req.body) {
      res.status(400).json({
        message: "Request body is missing",
      });
      return;
    }
    const projectInParseResult: ZodSafeParseResult<IProjectIn> =
      ZProjectIn.safeParse(req.body);
    if (!projectInParseResult.success) {
      res.status(400).json({
        message: z.prettifyError(projectInParseResult.error),
      });
      return;
    }

    const projectIn: IProjectIn = projectInParseResult.data;

    const existingRepos = await Project.find({
      $or: projectIn.repos.map((repo) => ({
        "repos.owner": repo.owner,
        "repos.repo": repo.repo,
      })),
    });

    if (existingRepos.length > 0) {
      res.status(400).json({
        message: "One or more Repos already exists",
      });
      return;
    }

    const newDbProject = new Project<IProjectIn>(projectIn);

    const addedProjectIn = await newDbProject.save();

    res.status(201).json({
      message: "Project added successfully into the database",
      repo: addedProjectIn,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.get("/projects", async (req, res) => {
  try {
    const projectsIn = await Project.find().lean();
    console.log(projectsIn[0].repos[0]._id);
    // const projectsOut: HydratedDocument<IProjectOut>[] = projectsIn.res
    //   .status(200)
    //   .json(projects);
    res.status(200).json({ message: "yo" });
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
    const repo = (
      await Project.findOne(
        { "repos._id": repoid },
        {
          "repos.$": 1,
          _id: 0,
        }
      )
    )?.repos[0];
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
    let langTree = docsTree.tree.filter(
      (item) =>
        item.path.startsWith("docs/" + lang + "/") ||
        item.path === "docs" + "/" + lang
    );
    if (langTree.length === 0) {
      langTree = docsTree.tree;
    }
    const dirs = langTree.filter((item) => item.type === "tree");
    const files = langTree.filter(
      (item) =>
        item.type === "blob" &&
        (item.path.endsWith(".md") || item.path.endsWith(".mdx"))
    );
    const filesContentsPromises = files.map(async (file) => {
      const fileContent = await getContent(repo, file.path, tag.commit.sha);
      return { file, matterContent: fileContent.matterContent };
    });
    const filesContents = await Promise.all(filesContentsPromises);
    const tagContent: ITagContent = {
      tag: tag,
      orderedTags: tags,
      orderedDirs: dirs
        .map((dir) => {
          const orderedFiles = filesContents
            .filter((fileContent) => {
              return (
                fileContent.file.path.split("/").slice(0, -1).join("/") ===
                dir.path
              );
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
    const repo = (
      await Project.findOne(
        { "repos._id": repoid },
        {
          "repos.$": 1,
          _id: 0,
        }
      )
    )?.repos[0];
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

router.get("/repo/:repoid/tags", async (req, res) => {
  try {
    const { repoid } = req.params;
    if (!isValidObjectId(repoid)) {
      res.status(400).json({
        message: "Invalid repo id",
      });
      return;
    }
    const repo = (
      await Project.findOne(
        { "repos._id": repoid },
        {
          "repos.$": 1,
          _id: 0,
        }
      )
    )?.repos[0];
    if (!repo) {
      res.status(404).json({
        message: "No repo found with id " + repoid,
      });
      return;
    }
    const tags = await getTags(repo);
    res.status(200).json(tags);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/repo/:repoid/fileContent/:filepath", async (req, res) => {
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
    const repo = (
      await Project.findOne(
        { "repos._id": repoid },
        {
          "repos.$": 1,
          _id: 0,
        }
      )
    )?.repos[0];
    if (!repo) {
      res.status(404).json({
        message: "No repo found with id " + repoid,
      });
      return;
    }
    const fileContent = await getContent(repo, filepath, ref);
    if (!fileContent) {
      res.status(404).json({
        message: "No file found with path " + filepath,
      });
      return;
    }
    res.status(200).json(fileContent);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.get("/repo/:repoid/didFileExist/:filepath", async (req, res) => {
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
    const repo = (
      await Project.findOne(
        { "repos._id": repoid },
        {
          "repos.$": 1,
          _id: 0,
        }
      )
    )?.repos[0];
    if (!repo) {
      res.status(404).json({
        message: "No repo found with id " + repoid,
      });
      return;
    }
    const docsTree = await getDocsTree(repo, sha);
    const files = docsTree.tree.filter(
      (item) =>
        item.type === "blob" &&
        (item.path.endsWith(".md") || item.path.endsWith(".mdx"))
    );
    const langFiles = files.filter(
      (item) =>
        item.path.startsWith("docs/" + lang + "/") ||
        item.path === "docs" + "/" + lang
    );
    if (langFiles.length === 0) {
      if (files.map((it) => it.path).includes(filepath)) {
        res.status(200).json({ exist: true });
        return;
      }
    } else if (langFiles.map((it) => it.path).includes(filepath)) {
      res.status(200).json({ exist: true });
      return;
    } else if (files.map((it) => it.path).includes(filepath)) {
      const filesContents = await Promise.all(
        files.map(async (it) => ({
          fileContent: await getContent(repo, it.path, sha),
          path: it.path,
        }))
      );
      const id = filesContents.find((it) => it.path === filepath)?.fileContent
        .matterContent.id;
      if (id) {
        const langFilesContents = filesContents.filter((fileContent) =>
          langFiles.map((it) => it.path).includes(fileContent.path)
        );
        const fileInLang = langFilesContents.find(
          (it) => it.fileContent.matterContent.id === id
        );
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
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

export default router;
