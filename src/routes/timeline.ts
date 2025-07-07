import express, { Request } from "express";
import fileUpload from "express-fileupload";
import isAdmin from "../middlewares/isAdmin.js";
import {
  ITimelineDatasNoMd,
  TimelineData,
  ZPartialTimelineData,
  ZTimelineData,
} from "../models/ITimelineData.js";
import { IOkResponse } from "../models/ITypedResponse.js";
import {
  getDownloadMdController,
  getMdFileContentController,
  getUpdateMarkdownController,
  getUploadMarkdownController,
} from "../../controllers/markdownHandling.js";

const router = express.Router();

router.post(
  "/timeline/upload",
  isAdmin,
  fileUpload(),
  getUploadMarkdownController(ZTimelineData, TimelineData)
);

router.put(
  "/timeline/update/:id",
  isAdmin,
  fileUpload(),
  getUpdateMarkdownController(ZPartialTimelineData, TimelineData)
);

router.get(
  "/timeline/noMdContents",
  async (req: Request, res: IOkResponse<ITimelineDatasNoMd>) => {
    const dbTimelineDatas = await TimelineData.find().lean();
    const timelineDatasNoMd: ITimelineDatasNoMd = {
      projects: [],
      studies: [],
      experiences: [],
    };
    dbTimelineDatas.forEach((dbTimelineData) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { mdContents, ...timelineDataNoMd } = dbTimelineData;
      switch (timelineDataNoMd.type) {
        case "studies":
          timelineDatasNoMd[timelineDataNoMd.type].push(timelineDataNoMd);
          break;
        case "experiences":
          timelineDatasNoMd[timelineDataNoMd.type].push(timelineDataNoMd);
          break;
        case "projects":
          timelineDatasNoMd[timelineDataNoMd.type].push(timelineDataNoMd);
      }
    });
    res.responsesFunc.sendOkResponse(timelineDatasNoMd);
  }
);

router.get("/timeline/downloadMd/:id", getDownloadMdController(TimelineData));

router.get(
  "/timeline/:id/fileContent",
  getMdFileContentController(ZTimelineData, TimelineData)
);

export default router;
