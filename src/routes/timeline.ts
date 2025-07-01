import express, { Request } from "express";
import fileUpload from "express-fileupload";
import isAdmin from "../middlewares/isAdmin.js";
import {
  IDbTimelineData,
  ITimelineData,
  ITimelineDatasNoMd,
  TimelineData,
  ZPartialTimelineData,
  ZTimelineData,
} from "../models/ITimelineData.js";
import {
  IBadRequestResponse,
  ICreatedResponse,
  IFileResponse,
  INotFoundResponse,
  IOkResponse,
} from "../models/ITypedResponse.js";
import { z } from "zod/v4";
import { isValidObjectId } from "mongoose";

const router = express.Router();

router.post(
  "/timeline/upload",
  isAdmin,
  fileUpload(),
  async (
    req: Request,
    res: IBadRequestResponse | ICreatedResponse<IDbTimelineData>
  ) => {
    if (!req.files) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "No file found in the request body."
      );
      return;
    }
    if (!req.files.markdown) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "No file found in the request body with key markdown."
      );
      return;
    }
    if (Array.isArray(req.files.markdown)) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "Only one file expected in the request body for key markdown, but multiple were found."
      );
      return;
    }
    const file = req.files.markdown;
    if (file.mimetype !== "text/markdown") {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "Markdown expected in request body for key markdown, but the file received had the folowing mimetype : " +
          file.mimetype
      );
      return;
    }
    const mdContent = file.data.toString("utf-8");

    if (!req.body) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "The request body is empty."
      );
      return;
    }

    const details = req.body.details;

    if (typeof details !== "string") {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "The value of the details key in the request body should be string, not : " +
          typeof details
      );
      return;
    }

    let jsonDetails: unknown;

    try {
      jsonDetails = details && JSON.parse(details);
    } catch (error) {
      if (error instanceof Error) {
        (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
          error.message
        );
      } else {
        (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
          "An error occured during the parsing of the details key of the request body. Please check that the format is a good json string format."
        );
      }
      return;
    }

    if (!jsonDetails || typeof jsonDetails !== "object") {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "Details key of the request body should be an object."
      );
      return;
    }

    const timelineDataParseResult = ZTimelineData.safeParse({
      ...jsonDetails,
      mdContent,
    });

    if (!timelineDataParseResult.success) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        z.prettifyError(timelineDataParseResult.error)
      );
      return;
    }

    const timelineData = timelineDataParseResult.data;

    const newDbTimelineData = new TimelineData<ITimelineData>(timelineData);

    const addedDbTimelineData = await newDbTimelineData.save();

    (
      res as ICreatedResponse<IDbTimelineData>
    ).responsesFunc.sendCreatedResponse(addedDbTimelineData);
  }
);

router.put(
  "/timeline/update/:id",
  isAdmin,
  fileUpload(),
  async (
    req: Request,
    res:
      | IBadRequestResponse
      | ICreatedResponse<IDbTimelineData>
      | INotFoundResponse
  ) => {
    let mdContent: string | undefined = undefined;
    if (req.files && req.files.markdown) {
      if (Array.isArray(req.files.markdown)) {
        (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
          "Only one file expected in the request body for key markdown, but multiple were found."
        );
        return;
      }
      const file = req.files.markdown;
      if (file.mimetype !== "text/markdown") {
        (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
          "Markdown expected in request body for key markdown, but the file received had the folowing mimetype : " +
            file.mimetype
        );
        return;
      }
      mdContent = file.data.toString("utf-8");
    }

    const details = req.body && req.body.details;

    if (typeof details !== "string" && typeof details !== "undefined") {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "The value of the details key in the request body should be string, not : " +
          typeof details
      );
      return;
    }

    let jsonDetails: unknown;

    try {
      jsonDetails = details && JSON.parse(details);
    } catch (error) {
      if (error instanceof Error) {
        (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
          error.message
        );
      } else {
        (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
          "An error occured during the parsing of the details key of the request body. Please check that the format is a good json string format."
        );
      }
      return;
    }

    if (!jsonDetails || typeof jsonDetails !== "object") {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "Details key of the request body should be an object."
      );
      return;
    }

    const notParsedTimelineData = mdContent
      ? {
          ...jsonDetails,
          mdContent,
        }
      : jsonDetails;

    const timelineDataParseResult = ZPartialTimelineData.safeParse(
      notParsedTimelineData
    );

    if (!timelineDataParseResult.success) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        z.prettifyError(timelineDataParseResult.error)
      );
      return;
    }

    const timelineData = timelineDataParseResult.data;

    const id = req.params.id;

    if (!isValidObjectId(id)) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "Invalid id"
      );
      return;
    }

    const dbTimelineData = await TimelineData.findById(id);

    if (!dbTimelineData) {
      (res as INotFoundResponse).responsesFunc.sendNotFoundResponse(
        "No timelineData found with id : " + id
      );
      return;
    }

    Object.assign(dbTimelineData, timelineData);

    const updatedDbTimelineData = await dbTimelineData.save();

    (
      res as ICreatedResponse<IDbTimelineData>
    ).responsesFunc.sendCreatedResponse(updatedDbTimelineData);
  }
);

router.get(
  "/timeline/noMdContent",
  async (req: Request, res: IOkResponse<ITimelineDatasNoMd>) => {
    const dbTimelineDatas = await TimelineData.find().lean();
    const timelineDatasNoMd: ITimelineDatasNoMd = {
      projects: [],
      studies: [],
      experiences: [],
    };
    dbTimelineDatas.forEach((dbTimelineData) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { mdContent, ...timelineDataNoMd } = dbTimelineData;
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

router.get(
  "/timeline/downloadMd/:id",
  async (
    req: Request,
    res: IBadRequestResponse | INotFoundResponse | IFileResponse
  ) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "Invalid id"
      );
      return;
    }

    const dbTimelineData = await TimelineData.findById(id).lean();

    if (!dbTimelineData) {
      (res as INotFoundResponse).responsesFunc.sendNotFoundResponse(
        "No timelineData found for id : " + id
      );
      return;
    }

    (res as IFileResponse).responsesFunc.sendFileResponse(
      dbTimelineData.mdContent,
      dbTimelineData.title.en,
      "md",
      "text/markdown"
    );
  }
);

export default router;
