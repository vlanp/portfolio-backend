import { UploadedFile } from "express-fileupload";

export const parsePicture = (picture: UploadedFile) => {
  const pictureBase64 = `data:${
    picture.mimetype
  };base64,${picture.data.toString("base64")}`;

  return pictureBase64;
};
