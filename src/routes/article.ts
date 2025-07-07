import express from "express";
import isAdmin from "../middlewares/isAdmin.js";
import fileUpload from "express-fileupload";
import { Article, ZArticle } from "../models/IArticle.js";
import {
  getDatasNoMdContent,
  getDownloadMdController,
  getMdFileContentController,
  getUpdateMarkdownController,
  getUploadMarkdownController,
} from "../../controllers/markdownHandling";

const router = express.Router();

router.post(
  "/article/upload",
  isAdmin,
  fileUpload(),
  getUploadMarkdownController(ZArticle, Article)
);

router.put(
  "/article/update/:id",
  isAdmin,
  fileUpload(),
  getUpdateMarkdownController(ZArticle.partial(), Article)
);

router.get("/article/noMdContents", getDatasNoMdContent(ZArticle, Article));

router.get("/article/downloadMd/:id", getDownloadMdController(Article));

router.get(
  "/article/:id/fileContent",
  getMdFileContentController(ZArticle, Article)
);

export default router;
