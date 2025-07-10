import express from "express";
import isAdmin from "../middlewares/isAdmin.js";
import fileUpload from "express-fileupload";
import {
  Article,
  IArticle,
  IDbArticle,
  IPartialArticle,
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
  getUploadMarkdownController<IArticle, IDbArticle>(ZArticle, Article, "imgUrl")
);

router.put(
  "/article/update/:id",
  isAdmin,
  fileUpload(),
  getUpdateMarkdownController<IPartialArticle, IDbArticle>(
    ZPartialArticle,
    Article,
    "imgUrl"
  )
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
