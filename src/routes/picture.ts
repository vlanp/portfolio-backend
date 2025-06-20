import express, { Request } from "express";
import fileUpload from "express-fileupload";
import {
  IBadRequestResponse,
  ICreatedResponse,
  INotFoundResponse,
  IOkResponse,
} from "../models/ITypedResponse";
import { parsePicture } from "../utils/pictures.js";
import { v2 as cloudinary } from "cloudinary";
import {
  IDbPicture,
  IPicture,
  Picture,
  ZEPicturesNames,
  ZPictureNoUrl,
} from "../models/IPicture.js";
import { z } from "zod/v4";
import { mainPictureFolder } from "../utils/config.js";

const router = express.Router();

router.post(
  "/picture/mainPicture",
  fileUpload(),
  async (
    req: Request,
    res: IBadRequestResponse | ICreatedResponse<IDbPicture>
  ) => {
    const bodyParseResult = ZPictureNoUrl.safeParse(req.body);

    if (!bodyParseResult.success) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        z.prettifyError(bodyParseResult.error)
      );
      return;
    }

    const pictureNoUrl = bodyParseResult.data;

    if (!req.files) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "No files found in the request"
      );
      return;
    }

    if (!req.files.picture) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "No picture found in the request"
      );
      return;
    }

    const picture = req.files.picture;

    if (Array.isArray(picture)) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "Only one picture is expected but " + picture.length + " were provided."
      );
      return;
    }

    const pictureBase64 = parsePicture(picture);

    const uploadPicture = await cloudinary.uploader.upload(pictureBase64, {
      folder: mainPictureFolder,
      timeout: 300000,
    });

    const newPicture = new Picture<IPicture>({
      ...pictureNoUrl,
      url: uploadPicture.secure_url,
    });

    const currentPicture = await Picture.findOne({
      name: ZEPicturesNames.enum.mainPicture,
    });

    if (currentPicture) {
      await currentPicture.deleteOne();
    }

    const savedPicture = await newPicture.save();

    (res as ICreatedResponse<IDbPicture>).responsesFunc.sendCreatedResponse(
      savedPicture
    );
  }
);

router.get(
  "/picture/mainPicture",
  async (req: Request, res: IOkResponse<IDbPicture> | INotFoundResponse) => {
    const picture = await Picture.findOne({
      name: ZEPicturesNames.enum.mainPicture,
    });

    if (!picture) {
      (res as INotFoundResponse).responsesFunc.sendNotFoundResponse();
      return;
    }

    (res as IOkResponse<IDbPicture>).responsesFunc.sendOkResponse(picture);
  }
);

export default router;
