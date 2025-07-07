import express from "express";
import isAdmin from "../middlewares/isAdmin.js";
import fileUpload from "express-fileupload";
import {
  Article,
  ZArticle,
  ZDbArticleNoMd,
  ZPartialArticle,
} from "../models/IArticle.js";
import {
  getDatasNoMdContents,
  getDownloadMdController,
  getMdFileContentController,
  getUpdateMarkdownController,
  getUploadMarkdownController,
} from "../../controllers/markdownHandling.js";

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
  getUpdateMarkdownController(ZPartialArticle, Article)
);

router.get(
  "/article/noMdContents",
  getDatasNoMdContents(ZDbArticleNoMd, Article)
);

router.get("/article/downloadMd/:id", getDownloadMdController(Article));

router.get(
  "/article/:id/fileContent",
  getMdFileContentController(ZArticle, Article)
);

export default router;
