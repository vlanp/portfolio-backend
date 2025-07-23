import { Request } from "express";
import {
  IBadRequestResponse,
  ICreatedResponse,
  IFileResponse,
  INotFoundResponse,
  IOkResponse,
} from "../models/ITypedResponse";
import { checkLocalizedFiles, ILang, ZELangs } from "../models/ILocalized.js";
import fileUpload from "express-fileupload";
import { z } from "zod/v4";
import mongoose, { HydratedDocument, isValidObjectId } from "mongoose";
import { IContent, IContentWithExtraData } from "../models/IMatter";
import { parsePicture } from "../utils/pictures.js";
import { v2 as cloudinary } from "cloudinary";
import { articlesFolder } from "../utils/config.js";
import {
  articlesCategoriesMapping,
  getAllChildsCategories,
} from "../models/IArticle.js";
import { ZESortsOut } from "../models/ISort.js";
import { ZLimit } from "../models/ILimit.js";
import { ZPage } from "../models/IPage.js";
import { IPaginated } from "../models/IPaginated";

const getUploadMarkdownController =
  <
    DataTypeIn extends {
      mdContents: Record<ILang, string>;
    },
    DataTypeOut extends DataTypeIn,
    DbDataType extends DataTypeOut
  >(
    ZDataType: z.ZodType<DataTypeOut, DataTypeIn>,
    MongooseModel: mongoose.Model<
      DbDataType,
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      HydratedDocument<NoInfer<DbDataType>>
    >,
    imgOptions?: {
      imgKey: keyof DataTypeIn & string;
      imgWidthKey: keyof DataTypeIn & string;
      imgHeightKey: keyof DataTypeIn & string;
    }
  ) =>
  async (
    req: Request,
    res: IBadRequestResponse | ICreatedResponse<DbDataType>
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

    const dataParseResult = await ZDataType.safeParseAsync({
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

    const newDbData = new MongooseModel<DataTypeIn>(data);

    const addedDbArticle = await newDbData.save();

    (res as ICreatedResponse<DbDataType>).responsesFunc.sendCreatedResponse(
      addedDbArticle
    );
  };

const getUpdateMarkdownController =
  <
    PartialDataTypeIn extends {
      mdContents?: Record<ILang, string>;
    },
    PartialDataTypeOut extends PartialDataTypeIn,
    DbDataType extends PartialDataTypeOut
  >(
    ZPartialDataType: z.ZodType<PartialDataTypeOut, PartialDataTypeIn>,
    MongooseModel: mongoose.Model<
      DbDataType,
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      HydratedDocument<NoInfer<DbDataType>>
    >,
    imgOptions?: {
      imgKey: keyof PartialDataTypeIn & string;
      imgWidthKey: keyof PartialDataTypeIn & string;
      imgHeightKey: keyof PartialDataTypeIn & string;
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

    const dataParseResult = await ZPartialDataType.safeParseAsync(
      notParsedData
    );

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
    DataTypeIn extends {
      mdContents: Record<ILang, string>;
    },
    DataTypeOut extends DataTypeIn & {
      htmlContents: Record<ILang, IContent<unknown>>;
      updatedAt: Date;
    },
    DbDataType extends DataTypeOut,
    Paginated extends boolean = false
  >(
    ZDbDataTypeNoMd: z.ZodType<
      Omit<NoInfer<DbDataType>, "mdContents" | "htmlContents">
    >,
    MongooseModel: mongoose.Model<
      DbDataType,
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      HydratedDocument<NoInfer<DbDataType>>
    >,
    paginated?: Paginated
  ) =>
  async (
    req: Request,
    res:
      | IBadRequestResponse
      | IOkResponse<
          typeof paginated extends true
            ? IPaginated<Omit<DbDataType, "mdContents" | "htmlContents">>
            : Omit<DbDataType, "mdContents" | "htmlContents">[]
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

    const sortParseResult = await ZESortsOut.optional().safeParseAsync(
      unsafeSort
    );

    if (!sortParseResult.success) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        z.prettifyError(sortParseResult.error)
      );
      return;
    }

    const sort = sortParseResult.data;

    const limitParseResult = await ZLimit.optional().safeParseAsync(
      unsafeLimit
    );

    if (!limitParseResult.success) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        z.prettifyError(limitParseResult.error)
      );
      return;
    }
    const limit = limitParseResult.data;

    const pageParseResult = await ZPage.optional().safeParseAsync(unsafePage);

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
    const datas = await Promise.all(
      unsafeDatas.map(async (unsafeData) => {
        const dataParseResult = await ZDbDataTypeNoMd.safeParseAsync(
          unsafeData
        );
        if (!dataParseResult.success) {
          throw new Error(z.prettifyError(dataParseResult.error));
        }
        return dataParseResult.data;
      })
    );
    if (paginated) {
      const paginatedDatas: IPaginated<
        Omit<DbDataType, "mdContents" | "htmlContents">
      > = {
        elements: datas,
        numberOfElements: numberOfDocuments,
        totalNumberOfElements: numberOfDocuments,
        totalPages: Math.ceil(numberOfDocuments / (limit || defaultLimit)),
      };
      (
        res as IOkResponse<
          IPaginated<Omit<DbDataType, "mdContents" | "htmlContents">>
        >
      ).responsesFunc.sendOkResponse(paginatedDatas);
    } else {
      (
        res as IOkResponse<Omit<DbDataType, "mdContents" | "htmlContents">[]>
      ).responsesFunc.sendOkResponse(datas);
    }
  };

const getDownloadMdController =
  <
    DataTypeIn extends {
      mdContents: Record<ILang, string>;
      title: Record<ILang, string>;
    },
    DataTypeOut extends DataTypeIn & {
      htmlContents: Record<ILang, IContent<unknown>>;
    },
    DbDataType extends DataTypeOut
  >(
    MongooseModel: mongoose.Model<
      DbDataType,
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      HydratedDocument<NoInfer<DbDataType>>
    >
  ) =>
  async (
    req: Request,
    res: IBadRequestResponse | INotFoundResponse | IFileResponse
  ) => {
    const { lang: unsafeLang } = req.query;

    const langParseResult = await ZELangs.safeParseAsync(unsafeLang);

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
    DataTypeIn extends {
      mdContents: Record<ILang, string>;
    },
    DataTypeOut extends DataTypeIn & {
      htmlContents: Record<ILang, IContent<unknown>>;
    },
    DbDataType extends DataTypeOut
  >(
    ZDbDataType: z.ZodType<NoInfer<DbDataType>>,
    MongooseModel: mongoose.Model<
      DbDataType,
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {},
      HydratedDocument<NoInfer<DbDataType>>
    >
  ) =>
  async (
    req: Request,
    res:
      | IBadRequestResponse
      | INotFoundResponse
      | IOkResponse<
          IContentWithExtraData<
            Omit<DataTypeOut, "mdContents" | "htmlContents">
          >
        >
  ) => {
    const { lang: unsafeLang } = req.query;

    const langParseResult = await ZELangs.safeParseAsync(unsafeLang);

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
    const dbDataParseResult = await ZDbDataType.safeParseAsync(unsafeDbData);

    if (!dbDataParseResult.success) {
      throw new Error(z.prettifyError(dbDataParseResult.error));
    }

    const dbData = dbDataParseResult.data;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { mdContents, htmlContents, ...dbDataNoMd } = dbData;
    const fileContentWithExtraData = {
      ...dbData.htmlContents[lang],
      extraData: dbDataNoMd,
    };
    (
      res as IOkResponse<
        IContentWithExtraData<Omit<DataTypeOut, "mdContents" | "htmlContents">>
      >
    ).responsesFunc.sendOkResponse(fileContentWithExtraData);
  };

export {
  getUploadMarkdownController,
  getUpdateMarkdownController,
  getDatasNoMdContentsController,
  getDownloadMdController,
  getMdFileContentController,
};
