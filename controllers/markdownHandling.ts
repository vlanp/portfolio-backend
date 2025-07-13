import { Request } from "express";
import {
  IBadRequestResponse,
  ICreatedResponse,
  IFileResponse,
  INotFoundResponse,
  IOkResponse,
} from "../src/models/ITypedResponse";
import {
  checkLocalizedFiles,
  ILang,
  ZELangs,
} from "../src/models/ILocalized.js";
import fileUpload from "express-fileupload";
import { z } from "zod/v4";
import mongoose, { HydratedDocument, isValidObjectId } from "mongoose";
import { IContentWithExtraData } from "../src/models/IMatter";
import { getContent } from "../src/utils/file.js";
import { parsePicture } from "../src/utils/pictures.js";
import { v2 as cloudinary } from "cloudinary";
import { articlesFolder } from "../src/utils/config.js";
import {
  articlesCategoriesMapping,
  getAllChildsCategories,
} from "../src/models/IArticle.js";
import { ZESortsOut } from "../src/models/ISort.js";
import { ZLimit } from "../src/models/ILimit.js";
import { ZPage } from "../src/models/IPage.js";
import { IPaginated } from "../src/models/IPaginated";

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
    >,
    imgOptions?: {
      imgKey: keyof DataType & string;
      imgWidthKey: keyof DataType & string;
      imgHeightKey: keyof DataType & string;
    }
  ) =>
  async (
    req: Request,
    res: IBadRequestResponse | ICreatedResponse<DataType>
  ) => {
    const baseMarkdownFilesKey = "markdown";
    const imageFileKey = "image";
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
      requestFiles[`${baseMarkdownFilesKey}${lang}`],
    ]);

    if (
      !checkLocalizedFiles(
        localizedMarkdowns,
        baseMarkdownFilesKey,
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

    let secureUrl: string | undefined = undefined;
    let width: number | undefined = undefined;
    let height: number | undefined = undefined;
    if (imgOptions) {
      const picture = requestFiles[imageFileKey];

      if (!picture) {
        (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
          `No file found in the request body with key ${imageFileKey}.`
        );
        return;
      }

      if (Array.isArray(picture)) {
        (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
          `Only one file expected in the request body for key ${imageFileKey}, but multiple were found.`
        );
        return;
      }

      const pictureBase64 = parsePicture(picture);

      const uploadPicture = await cloudinary.uploader.upload(pictureBase64, {
        folder: articlesFolder,
        timeout: 300000,
      });

      secureUrl = uploadPicture.secure_url;
      width = uploadPicture.width;
      height = uploadPicture.height;
    }

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
      ...(imgOptions ? { [imgOptions.imgKey]: secureUrl } : {}),
      ...(imgOptions ? { [imgOptions.imgWidthKey]: width } : {}),
      ...(imgOptions ? { [imgOptions.imgHeightKey]: height } : {}),
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
      addedDbArticle.toObject()
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
    >,
    imgOptions?: {
      imgKey: keyof PartialDataType & string;
      imgWidthKey: keyof PartialDataType & string;
      imgHeightKey: keyof PartialDataType & string;
    }
  ) =>
  async (
    req: Request,
    res: IBadRequestResponse | ICreatedResponse<DbDataType> | INotFoundResponse
  ) => {
    const baseMarkdownFilesKey = "markdown";
    const imageFileKey = "image";
    const requestFiles = req.files;
    let mdContents: Record<ILang, string> | undefined = undefined;
    let secureUrl: string | undefined = undefined;
    let width: number | undefined = undefined;
    let height: number | undefined = undefined;
    if (requestFiles) {
      const localizedMarkdowns: [
        ILang,
        fileUpload.UploadedFile | fileUpload.UploadedFile[]
      ][] = ZELangs.options.map((lang) => [
        lang,
        requestFiles[`${baseMarkdownFilesKey}${lang}`],
      ]);

      const filteredLocalizedMarkdowns = localizedMarkdowns.filter(
        ([, value]) => value !== undefined
      );

      if (filteredLocalizedMarkdowns.length > 0) {
        if (
          !checkLocalizedFiles(
            filteredLocalizedMarkdowns,
            baseMarkdownFilesKey,
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

      if (imgOptions) {
        const picture = requestFiles[imageFileKey];

        if (picture) {
          if (Array.isArray(picture)) {
            (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
              `Only one file expected in the request body for key ${imageFileKey}, but multiple were found.`
            );
            return;
          }
          const pictureBase64 = parsePicture(picture);

          const uploadPicture = await cloudinary.uploader.upload(
            pictureBase64,
            {
              folder: articlesFolder,
              timeout: 300000,
            }
          );

          secureUrl = uploadPicture.secure_url;
          width = uploadPicture.width;
          height = uploadPicture.height;
        }
      }
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

    let notParsedData = mdContents
      ? {
          ...jsonDetails,
          mdContents: {
            ...dbData.mdContents,
            ...mdContents,
          },
        }
      : jsonDetails;

    notParsedData = imgOptions
      ? {
          ...notParsedData,
          [imgOptions.imgKey]: secureUrl
            ? secureUrl
            : dbData[imgOptions.imgKey],
          [imgOptions.imgWidthKey]: width
            ? width
            : dbData[imgOptions.imgWidthKey],
          [imgOptions.imgHeightKey]: height
            ? height
            : dbData[imgOptions.imgHeightKey],
        }
      : notParsedData;

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

const getDatasNoMdContentsController =
  <
    DataType extends {
      mdContents: Record<ILang, string>;
      updatedAt: Date;
    },
    DbDataType extends DataType,
    Paginated extends boolean = false
  >(
    ZDbDataTypeNoMd: z.ZodType<Omit<DbDataType, "mdContents">>,
    MongooseModel: mongoose.Model<
      DbDataType,
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      HydratedDocument<DbDataType>
    >,
    paginated?: Paginated
  ) =>
  async (
    req: Request,
    res:
      | IBadRequestResponse
      | IOkResponse<
          typeof paginated extends true
            ? IPaginated<Omit<DbDataType, "mdContents">>
            : Omit<DbDataType, "mdContents">[]
        >
  ) => {
    const filterKey = "categoryId";
    const pageKey = "page";
    const limitKey = "limit";
    const sortKey = "sort";
    const categoryId = req.query[filterKey];
    const unsafeSort = req.query[sortKey];
    const unsafeLimit = req.query[limitKey];
    const unsafePage = req.query[pageKey];
    const defaultLimit = 20;

    const categoriesIds =
      typeof categoryId === "string"
        ? [categoryId]
        : Array.isArray(categoryId)
        ? categoryId
        : undefined;

    if (categoriesIds) {
      for (const categoryId of categoriesIds) {
        if (
          !Object.values(articlesCategoriesMapping)
            .map((v) => v.id)
            .includes(
              categoryId as (typeof articlesCategoriesMapping)[keyof typeof articlesCategoriesMapping]["id"]
            )
        ) {
          (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
            `Invalid categoryId: ${categoryId}.`
          );
          return;
        }
      }
    }
    const categoriesNames =
      categoriesIds &&
      categoriesIds
        .map(
          (id) =>
            Object.values(articlesCategoriesMapping).find((it) => it.id === id)
              ?.name
        )
        .filter((it) => it !== undefined);

    const allChildsCategories = categoriesNames?.flatMap((categoryName) =>
      getAllChildsCategories(categoryName)
    );

    const sortParseResult = ZESortsOut.optional().safeParse(unsafeSort);

    if (!sortParseResult.success) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        z.prettifyError(sortParseResult.error)
      );
      return;
    }

    const sort = sortParseResult.data;

    const limitParseResult = ZLimit.optional().safeParse(unsafeLimit);

    if (!limitParseResult.success) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        z.prettifyError(limitParseResult.error)
      );
      return;
    }
    const limit = limitParseResult.data;

    const pageParseResult = ZPage.optional().safeParse(unsafePage);

    if (!pageParseResult.success) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        z.prettifyError(pageParseResult.error)
      );
      return;
    }
    const page = pageParseResult.data;

    const numberOfDocuments = await MongooseModel.countDocuments(
      allChildsCategories
        ? {
            category: {
              $in: allChildsCategories,
            },
          }
        : {},
      { mdContents: 0 }
    );

    const unsafeDatas = await MongooseModel.find(
      allChildsCategories
        ? {
            category: {
              $in: allChildsCategories,
            },
          }
        : {},
      { mdContents: 0 }
    )
      .sort({ updatedAt: sort ? sort : "ascending" })
      .limit(limit ? limit : defaultLimit)
      .skip(page ? (page - 1) * (limit ? limit : defaultLimit) : 0)
      .lean();
    const datas = unsafeDatas.map((unsafeData) => {
      const dataParseResult = ZDbDataTypeNoMd.safeParse(unsafeData);
      if (!dataParseResult.success) {
        throw new Error(z.prettifyError(dataParseResult.error));
      }
      return dataParseResult.data;
    });
    if (paginated) {
      const paginatedDatas: IPaginated<Omit<DbDataType, "mdContents">> = {
        elements: datas,
        numberOfElements: numberOfDocuments,
        totalNumberOfElements: numberOfDocuments,
        totalPages: Math.ceil(numberOfDocuments / (limit || defaultLimit)),
      };
      (
        res as IOkResponse<IPaginated<Omit<DbDataType, "mdContents">>>
      ).responsesFunc.sendOkResponse(paginatedDatas);
    } else {
      (
        res as IOkResponse<Omit<DbDataType, "mdContents">[]>
      ).responsesFunc.sendOkResponse(datas);
    }
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
    ZDbDataType: z.ZodType<DbDataType>,
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
    const dbDataParseResult = ZDbDataType.safeParse(unsafeDbData);

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
  getDatasNoMdContentsController,
  getDownloadMdController,
  getMdFileContentController,
};
