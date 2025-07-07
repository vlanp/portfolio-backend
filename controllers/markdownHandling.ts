import { Request } from "express";
import {
  IBadRequestResponse,
  ICreatedResponse,
  IFileResponse,
  INotFoundResponse,
  IOkResponse,
} from "../src/models/ITypedResponse";
import { checkLocalizedFiles, ILang, ZELangs } from "../src/models/ILocalized";
import fileUpload from "express-fileupload";
import { z } from "zod/v4";
import mongoose, { HydratedDocument, isValidObjectId } from "mongoose";
import { IContentWithExtraData } from "../src/models/IMatter";
import { getContent } from "../src/utils/file";

const getUploadMarkdownController =
  <
    DataType extends {
      mdContents: Record<ILang, string>;
    },
    DbDataType extends DataType
  >(
    ZDataType: z.ZodType<DataType, DataType>,
    MongooseModel: mongoose.Model<
      DbDataType,
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      HydratedDocument<DbDataType>
    >
  ) =>
  async (
    req: Request,
    res: IBadRequestResponse | ICreatedResponse<DataType>
  ) => {
    const baseFileKey = "markdown";
    const requestFiles = req.files;
    if (!requestFiles) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "No file found in the request body."
      );
      return;
    }

    const localizedMarkdowns: [
      ILang,
      fileUpload.UploadedFile | fileUpload.UploadedFile[]
    ][] = ZELangs.options.map((lang) => [
      lang,
      requestFiles[`${baseFileKey}${lang}`],
    ]);

    if (
      !checkLocalizedFiles(
        localizedMarkdowns,
        baseFileKey,
        res as IBadRequestResponse
      )
    ) {
      return;
    }

    const mdContents = Object.fromEntries(
      localizedMarkdowns.map((localizedMarkdown) => [
        localizedMarkdown[0],
        localizedMarkdown[1].data.toString("utf-8"),
      ])
    ) as Record<ILang, string>;

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

    const dataParseResult = ZDataType.safeParse({
      ...jsonDetails,
      mdContents: mdContents,
    });

    if (!dataParseResult.success) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        z.prettifyError(dataParseResult.error)
      );
      return;
    }

    const data = dataParseResult.data;

    const newDbData = new MongooseModel<DataType>(data);

    const addedDbArticle = await newDbData.save();

    (res as ICreatedResponse<DbDataType>).responsesFunc.sendCreatedResponse(
      addedDbArticle
    );
  };

const getUpdateMarkdownController =
  <
    PartialDataType extends {
      mdContents?: Record<ILang, string>;
    },
    DbDataType extends PartialDataType
  >(
    ZPartialDataType: z.ZodType<PartialDataType>,
    MongooseModel: mongoose.Model<
      DbDataType,
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      HydratedDocument<DbDataType>
    >
  ) =>
  async (
    req: Request,
    res: IBadRequestResponse | ICreatedResponse<DbDataType> | INotFoundResponse
  ) => {
    const baseFileKey = "markdown";
    const requestFiles = req.files;
    let mdContents: Record<ILang, string> | undefined = undefined;
    if (requestFiles) {
      const localizedMarkdowns: [
        ILang,
        fileUpload.UploadedFile | fileUpload.UploadedFile[]
      ][] = ZELangs.options.map((lang) => [
        lang,
        requestFiles[`${baseFileKey}${lang}`],
      ]);

      const filteredLocalizedMarkdowns = localizedMarkdowns.filter(
        ([localizedMarkdown]) => localizedMarkdown !== undefined
      );

      if (
        !checkLocalizedFiles(
          filteredLocalizedMarkdowns,
          baseFileKey,
          res as IBadRequestResponse
        )
      ) {
        return;
      }

      mdContents = Object.fromEntries(
        filteredLocalizedMarkdowns.map((localizedMarkdown) => [
          localizedMarkdown[0],
          localizedMarkdown[1].data.toString("utf-8"),
        ])
      ) as Record<ILang, string>;
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

    const id = req.params.id;

    if (!isValidObjectId(id)) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "Invalid id"
      );
      return;
    }

    const dbData = await MongooseModel.findById(id);

    if (!dbData) {
      (res as INotFoundResponse).responsesFunc.sendNotFoundResponse(
        "No dbData found with id : " + id
      );
      return;
    }

    const notParsedData = mdContents
      ? {
          ...jsonDetails,
          mdContents: {
            ...dbData.mdContents,
            ...mdContents,
          },
        }
      : jsonDetails;

    const dataParseResult = ZPartialDataType.safeParse(notParsedData);

    if (!dataParseResult.success) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        z.prettifyError(dataParseResult.error)
      );
      return;
    }

    const data = dataParseResult.data;

    Object.assign(dbData, data);

    const updatedDbData = await dbData.save();

    (res as ICreatedResponse<DbDataType>).responsesFunc.sendCreatedResponse(
      updatedDbData
    );
  };

const getDatasNoMdContent =
  <
    DataType extends {
      mdContents: Record<ILang, string>;
    },
    DbDataType extends DataType
  >(
    ZDataTypeNoMd: z.ZodType<
      Omit<DataType, "mdContents">,
      Omit<DataType, "mdContents">
    >,
    MongooseModel: mongoose.Model<
      DbDataType,
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      HydratedDocument<DbDataType>
    >
  ) =>
  async (req: Request, res: IOkResponse<Omit<DataType, "mdContents">[]>) => {
    const unsafeDatas = await MongooseModel.find({}, { mdContents: 0 }).lean();
    const datas = unsafeDatas.map((unsafeData) => {
      const dataParseResult = ZDataTypeNoMd.safeParse(unsafeData);
      if (!dataParseResult.success) {
        throw new Error(z.prettifyError(dataParseResult.error));
      }
      return dataParseResult.data;
    });
    (
      res as IOkResponse<Omit<DataType, "mdContents">[]>
    ).responsesFunc.sendOkResponse(datas);
  };

const getDownloadMdController =
  <
    DataType extends {
      mdContents: Record<ILang, string>;
      title: Record<ILang, string>;
    },
    DbDataType extends DataType
  >(
    MongooseModel: mongoose.Model<
      DbDataType,
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      HydratedDocument<DbDataType>
    >
  ) =>
  async (
    req: Request,
    res: IBadRequestResponse | INotFoundResponse | IFileResponse
  ) => {
    const { lang: unsafeLang } = req.query;

    const langParseResult = ZELangs.safeParse(unsafeLang);

    if (!langParseResult.success) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        z.prettifyError(langParseResult.error)
      );
      return;
    }

    const lang = langParseResult.data;

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "Invalid id"
      );
      return;
    }

    const dbData = await MongooseModel.findById(id).lean();

    if (!dbData) {
      (res as INotFoundResponse).responsesFunc.sendNotFoundResponse(
        "No dbData found for id : " + id
      );
      return;
    }

    (res as IFileResponse).responsesFunc.sendFileResponse(
      dbData.mdContents[lang],
      dbData.title[lang],
      "md",
      "text/markdown"
    );
  };

const getMdFileContentController =
  <
    DataType extends {
      mdContents: Record<ILang, string>;
    },
    DbDataType extends DataType
  >(
    ZDataType: z.ZodType<DataType, DataType>,
    MongooseModel: mongoose.Model<
      DbDataType,
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      HydratedDocument<DbDataType>
    >
  ) =>
  async (
    req: Request,
    res:
      | IBadRequestResponse
      | INotFoundResponse
      | IOkResponse<IContentWithExtraData<Omit<DataType, "mdContents">>>
  ) => {
    const { lang: unsafeLang } = req.query;

    const langParseResult = ZELangs.safeParse(unsafeLang);

    if (!langParseResult.success) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        z.prettifyError(langParseResult.error)
      );
      return;
    }

    const lang = langParseResult.data;

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "Invalid repo id"
      );
      return;
    }
    const unsafeDbData = await MongooseModel.findById(id).lean();
    if (!unsafeDbData) {
      (res as INotFoundResponse).responsesFunc.sendNotFoundResponse(
        "No timelineData found with id : " + id
      );
      return;
    }
    const dbDataParseResult = ZDataType.safeParse(unsafeDbData);

    if (!dbDataParseResult.success) {
      throw new Error(z.prettifyError(dbDataParseResult.error));
    }

    const dbData = dbDataParseResult.data;

    const fileContent = await getContent(dbData.mdContents[lang]);
    if (!fileContent) {
      (res as INotFoundResponse).responsesFunc.sendNotFoundResponse(
        "No file content found."
      );
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { mdContents, ...dbDataNoMd } = dbData;
    const fileContentWithExtraData = {
      ...fileContent,
      extraData: dbDataNoMd,
    };
    (
      res as IOkResponse<IContentWithExtraData<Omit<DataType, "mdContents">>>
    ).responsesFunc.sendOkResponse(fileContentWithExtraData);
  };

export {
  getUploadMarkdownController,
  getUpdateMarkdownController,
  getDatasNoMdContent,
  getDownloadMdController,
  getMdFileContentController,
};
