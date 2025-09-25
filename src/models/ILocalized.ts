import fileUpload from "express-fileupload";
import { z } from "zod/v4";
import { IBadRequestResponse } from "./ITypedResponse";

const langs = ["en", "fr"] as const;

const ZELangs = z.enum(langs);

type ILang = (typeof langs)[number];

type ILocalized = {
  [l in ILang]: string;
};

const localizationValidator = (value: Map<string, string>): boolean => {
  const langs = Array.from(value.keys());
  const langsParseResult = langs.map((lang) => ZELangs.safeParse(lang));
  return langsParseResult.every((langParseResult) => langParseResult.success);
};

const checkLocalizedFiles = (
  localizedFiles: [
    ILang,
    fileUpload.UploadedFile | fileUpload.UploadedFile[] | undefined
  ][],
  baseFileKey: string,
  res: IBadRequestResponse
): localizedFiles is [ILang, fileUpload.UploadedFile][] => {
  for (const localizedFile of localizedFiles) {
    const markdown = localizedFile[1];
    if (!markdown) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        `No file found in the request body with key ${baseFileKey}${localizedFile[0]}.`
      );
      return false;
    }

    if (Array.isArray(markdown)) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        `Only one file expected in the request body for key ${baseFileKey}${localizedFile[0]}, but multiple were found.`
      );
      return false;
    }

    if (markdown.mimetype !== "text/markdown") {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        `Markdown expected in request body for key ${baseFileKey}${localizedFile[0]}, but the file received had the folowing mimetype : ${markdown.mimetype}`
      );
      return false;
    }
  }
  return true;
};

export type { ILang, ILocalized };
export { langs, ZELangs, localizationValidator, checkLocalizedFiles };
