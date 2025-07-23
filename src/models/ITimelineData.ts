import z from "zod/v4";
import { localizationValidator, ZELangs } from "./ILocalized.js";
import mongoose, { HydratedDocument, Model, Types } from "mongoose";
import { createRecordSchema } from "../utils/mongooseCommon.js";
import { getZContent, parseContent, stringifyContent } from "./IMatter.js";
import {
  createHtmlContents,
  createPartialHtmlContents,
} from "../utils/zodCommon.js";

const ZETimelineElements = z.enum(["studies", "experiences", "projects"]);

type ITimelineElement = z.infer<typeof ZETimelineElements>;

const ZTimelineStudiesDataIn = z.object({
  title: z.record(ZELangs, z.string()),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  description: z.record(ZELangs, z.string()),
  establishement: z.string(),
  place: z.string().optional(),
  mdContents: z.record(ZELangs, z.string()),
  type: z.literal(ZETimelineElements.enum.studies),
});

type ITimelineStudiesDataIn = z.infer<typeof ZTimelineStudiesDataIn>;

const ZTimelineStudiesData =
  ZTimelineStudiesDataIn.transform(createHtmlContents);

type ITimelineStudiesData = z.infer<typeof ZTimelineStudiesData>;

const ZTimelineExperiencesDataIn = z.object({
  title: z.record(ZELangs, z.string()),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  description: z.record(ZELangs, z.string()),
  enterprise: z.string().optional(),
  place: z.string().optional(),
  mdContents: z.record(ZELangs, z.string()),
  type: z.literal(ZETimelineElements.enum.experiences),
});

type ITimelineExperiencesDataIn = z.infer<typeof ZTimelineExperiencesDataIn>;

const ZTimelineExperiencesData =
  ZTimelineExperiencesDataIn.transform(createHtmlContents);

type ITimelineExperiencesData = z.infer<typeof ZTimelineExperiencesData>;

const ZTimelineProjectsDataIn = z.object({
  title: z.record(ZELangs, z.string()),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  description: z.record(ZELangs, z.string()),
  technologies: z.string(),
  status: z.object({
    [ZELangs.enum.en]: z.enum([
      "Creation in progress",
      "Update in progress",
      "Paused",
      "Completed",
    ]),
    [ZELangs.enum.fr]: z.enum([
      "En cours de création",
      "Mise à jour en cours",
      "En pause",
      "Terminé",
    ]),
  }),
  mdContents: z.record(ZELangs, z.string()),
  type: z.literal(ZETimelineElements.enum.projects),
});

type ITimelineProjectsDataIn = z.infer<typeof ZTimelineProjectsDataIn>;

const ZTimelineProjectsData =
  ZTimelineProjectsDataIn.transform(createHtmlContents);

type ITimelineProjectsData = z.infer<typeof ZTimelineProjectsData>;

const ZTimelineDataIn = z.discriminatedUnion("type", [
  ZTimelineExperiencesDataIn,
  ZTimelineProjectsDataIn,
  ZTimelineStudiesDataIn,
]);

type ITimelineDataIn = z.infer<typeof ZTimelineDataIn>;

const ZPartialTimelineDataIn = z.discriminatedUnion("type", [
  ZTimelineExperiencesDataIn.partial(),
  ZTimelineProjectsDataIn.partial(),
  ZTimelineStudiesDataIn.partial(),
]);

type IPartialTimelineDataIn = z.infer<typeof ZPartialTimelineDataIn>;

const ZTimelineData = z.union([
  ZTimelineExperiencesData,
  ZTimelineProjectsData,
  ZTimelineStudiesData,
]);

type ITimelineData = z.infer<typeof ZTimelineData>;

const ZPartialTimelineData = z.union([
  ZTimelineExperiencesDataIn.partial().transform(createPartialHtmlContents),
  ZTimelineProjectsDataIn.partial().transform(createPartialHtmlContents),
  ZTimelineStudiesDataIn.partial().transform(createPartialHtmlContents),
]);

type IPartialTimelineData = z.infer<typeof ZPartialTimelineData>;

const createZodDb = <T extends z.ZodRawShape>(baseSchema: z.ZodObject<T>) =>
  z.object({
    ...baseSchema.shape,
    htmlContents: z.record(ZELangs, getZContent(z.unknown())),
    _id: z.instanceof(Types.ObjectId),
    createdAt: z.instanceof(Date),
    updatedAt: z.instanceof(Date),
    __v: z.number(),
  });

const ZDbTimelineData = z.union([
  createZodDb(ZTimelineExperiencesDataIn),
  createZodDb(ZTimelineProjectsDataIn),
  createZodDb(ZTimelineStudiesDataIn),
]);

type IDbTimelineData = z.infer<typeof ZDbTimelineData>;

const ZDbTimelineDataNoMd = z.discriminatedUnion("type", [
  createZodDb(ZTimelineExperiencesDataIn).omit({
    mdContents: true,
    htmlContents: true,
  }),
  createZodDb(ZTimelineProjectsDataIn).omit({
    mdContents: true,
    htmlContents: true,
  }),
  createZodDb(ZTimelineStudiesDataIn).omit({
    mdContents: true,
    htmlContents: true,
  }),
]);

type IDbTimelineDataNoMd = z.infer<typeof ZDbTimelineDataNoMd>;

type IHydratedTimelineDataDocument = HydratedDocument<IDbTimelineData>;

type ITimelineDataModel = Model<
  IDbTimelineData,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  {},
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  {},
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  {},
  IHydratedTimelineDataDocument
>;

const TimelineDataSchema = new mongoose.Schema<
  ITimelineData,
  ITimelineDataModel
>(
  {
    title: createRecordSchema(ZELangs.options),
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: false,
    },
    description: createRecordSchema(ZELangs.options),
    mdContents: createRecordSchema(ZELangs.options),
    htmlContents: createRecordSchema(
      ZELangs.options,
      parseContent,
      stringifyContent
    ),
    type: {
      type: String,
      required: true,
      enum: ZETimelineElements.options,
    },

    establishement: {
      type: String,
      required: function (this: ITimelineData) {
        return this.type === "studies";
      },
    },

    enterprise: {
      type: String,
      required: false,
    },

    place: {
      type: String,
      required: false,
    },

    technologies: {
      type: String,
      required: function (this: ITimelineData) {
        return this.type === "projects";
      },
    },
    status: {
      type: Object.fromEntries(
        ZELangs.options.map((lang) => [
          lang,
          {
            type: String,
            enum: ZTimelineProjectsDataIn.shape.status.shape[lang].options,
            required: true,
          },
        ])
      ),
      required: function (this: ITimelineData) {
        return this.type === "projects";
      },
      validate: {
        validator: localizationValidator,
        message: `Status must contain following keys : ${ZELangs.options}`,
      },
    },
  },
  {
    timestamps: true,
    _id: true,
    discriminatorKey: "type",
  }
);

TimelineDataSchema.pre("validate", function () {
  if (this.endDate && this.startDate && this.endDate < this.startDate) {
    this.invalidate("endDate", "End date must be after start date");
  }
});

const TimelineData = mongoose.model<ITimelineData, ITimelineDataModel>(
  "TimelineData",
  TimelineDataSchema
);

const ZTimelineDatasNoMd = z.strictObject({
  [ZETimelineElements.enum.experiences]: z.array(
    createZodDb(ZTimelineExperiencesDataIn).omit({
      mdContents: true,
      htmlContents: true,
    })
  ),
  [ZETimelineElements.enum.projects]: z.array(
    createZodDb(ZTimelineProjectsDataIn).omit({
      mdContents: true,
      htmlContents: true,
    })
  ),
  [ZETimelineElements.enum.studies]: z.array(
    createZodDb(ZTimelineStudiesDataIn).omit({
      mdContents: true,
      htmlContents: true,
    })
  ),
});

type ITimelineDatasNoMd = z.infer<typeof ZTimelineDatasNoMd>;

export type {
  ITimelineData,
  ITimelineElement,
  ITimelineDatasNoMd,
  ITimelineProjectsData,
  ITimelineExperiencesData,
  ITimelineStudiesData,
  IDbTimelineData,
  IPartialTimelineDataIn,
  IDbTimelineDataNoMd,
  ITimelineStudiesDataIn,
  ITimelineExperiencesDataIn,
  ITimelineProjectsDataIn,
  ITimelineDataIn,
  IPartialTimelineData,
};
export {
  ZTimelineData,
  ZETimelineElements,
  ZTimelineDatasNoMd,
  ZTimelineExperiencesData,
  ZTimelineProjectsData,
  ZTimelineStudiesData,
  ZDbTimelineData,
  TimelineData,
  ZPartialTimelineDataIn,
  ZDbTimelineDataNoMd,
  ZTimelineDataIn,
  ZPartialTimelineData,
};
