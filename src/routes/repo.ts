import express from "express";
import { IRepo, Repo } from "../models/IRepo.js";
import isAdmin from "../middlewares/isAdmin.js";
import expressCache, { invalidateCache } from "../utils/expressCache.js";

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

    invalidateCache("repo");

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

router.get(
  "/repo/:id",
  expressCache({
    dependencies: ["repo"],
    timeToLiveMin: 5,
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const repo = await Repo.findById(id);
      if (!repo) {
        res.status(404).json({
          message: "No repo found with id " + id,
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
  }
);

export default router;
