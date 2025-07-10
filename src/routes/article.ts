import express, { Request } from "express";
import isAdmin from "../middlewares/isAdmin.js";
import fileUpload from "express-fileupload";
import {
  Article,
  getArticlesCategories,
  IArticle,
  IArticlesCategories,
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
import { IOkResponse } from "../models/ITypedResponse.js";

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

router.get(
  "/articlesCategories",
  async (_req: Request, res: IOkResponse<IArticlesCategories>) => {
    const articlesCategories = await getArticlesCategories();
    res.responsesFunc.sendOkResponse(articlesCategories);
  }
);

export default router;
