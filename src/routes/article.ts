import express, { Request } from "express";
import isAdmin from "../middlewares/isAdmin.js";
import fileUpload from "express-fileupload";
import {
  Article,
  getArticlesCategories,
  IArticlesCategories,
  ZArticle,
  ZDbArticle,
  ZDbArticleNoMd,
  ZPartialArticle,
} from "../models/IArticle.js";
import {
  getDatasNoMdContentsController,
  getDownloadMdController,
  getMdFileContentController,
  getUpdateMarkdownController,
  getUploadMarkdownController,
} from "../controllers/markdownHandling.js";
import { IOkResponse } from "../models/ITypedResponse.js";

const router = express.Router();

router.post(
  "/article/upload",
  isAdmin,
  fileUpload(),
  getUploadMarkdownController(ZArticle, Article, {
    imgKey: "imgUrl",
    imgWidthKey: "imgWidth",
    imgHeightKey: "imgHeight",
  })
);

router.put(
  "/article/update/:id",
  isAdmin,
  fileUpload(),
  getUpdateMarkdownController(ZPartialArticle, Article, {
    imgKey: "imgUrl",
    imgWidthKey: "imgWidth",
    imgHeightKey: "imgHeight",
  })
);

router.get(
  "/article/noMdContents",
  getDatasNoMdContentsController(ZDbArticleNoMd, Article, true)
);

router.get("/article/downloadMd/:id", getDownloadMdController(Article));

router.get(
  "/article/:id/fileContent",
  getMdFileContentController(ZDbArticle, Article)
);

router.get(
  "/article/articlesCategories",
  async (_req: Request, res: IOkResponse<IArticlesCategories>) => {
    const articlesCategories = await getArticlesCategories();
    res.responsesFunc.sendOkResponse(articlesCategories);
  }
);

export default router;
