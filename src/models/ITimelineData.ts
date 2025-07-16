import z from "zod/v4";
import { localizationValidator, ZELangs } from "./ILocalized.js";
import mongoose, { HydratedDocument, Model, Types } from "mongoose";
import { createRecordSchema } from "../utils/mongooseCommon.js";

const ZETimelineElements = z.enum(["studies", "experiences", "projects"]);

type ITimelineElement = z.infer<typeof ZETimelineElements>;

const ZTimelineStudiesData = z.object({
  title: z.record(ZELangs, z.string()),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  description: z.record(ZELangs, z.string()),
  establishement: z.string(),
  place: z.string().optional(),
  mdContents: z.record(ZELangs, z.string()),
  type: z.literal(ZETimelineElements.enum.studies),
});

type ITimelineStudiesData = z.infer<typeof ZTimelineStudiesData>;

const ZTimelineExperiencesData = z.object({
  title: z.record(ZELangs, z.string()),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  description: z.record(ZELangs, z.string()),
  enterprise: z.string().optional(),
  place: z.string().optional(),
  mdContents: z.record(ZELangs, z.string()),
  type: z.literal(ZETimelineElements.enum.experiences),
});

type ITimelineExperiencesData = z.infer<typeof ZTimelineExperiencesData>;

const ZTimelineProjectsData = z.object({
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

type ITimelineProjectsData = z.infer<typeof ZTimelineProjectsData>;

const ZTimelineData = z.discriminatedUnion("type", [
  ZTimelineExperiencesData,
  ZTimelineProjectsData,
  ZTimelineStudiesData,
]);

type ITimelineData = z.infer<typeof ZTimelineData>;

const ZPartialTimelineData = z.discriminatedUnion("type", [
  ZTimelineExperiencesData.partial(),
  ZTimelineProjectsData.partial(),
  ZTimelineStudiesData.partial(),
]);

type IPartialTimelineData = z.infer<typeof ZPartialTimelineData>;

const createZodDb = <T extends z.ZodRawShape>(baseSchema: z.ZodObject<T>) =>
  z.object({
    ...baseSchema.shape,
    _id: z.instanceof(Types.ObjectId),
    createdAt: z.instanceof(Date),
    updatedAt: z.instanceof(Date),
    __v: z.number(),
  });

const ZDbTimelineData = z.discriminatedUnion("type", [
  createZodDb(ZTimelineExperiencesData),
  createZodDb(ZTimelineProjectsData),
  createZodDb(ZTimelineStudiesData),
]);

type IDbTimelineData = z.infer<typeof ZDbTimelineData>;

const ZDbTimelineDataNoMd = z.discriminatedUnion("type", [
  createZodDb(ZTimelineExperiencesData).omit({ mdContents: true }),
  createZodDb(ZTimelineProjectsData).omit({ mdContents: true }),
  createZodDb(ZTimelineStudiesData).omit({ mdContents: true }),
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
    mdContents: {
      type: Map,
      of: String,
      required: true,
      validate: {
        validator: localizationValidator,
        message: `mdContent must contain following keys : ${ZELangs.options}`,
      },
    },
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
            enum: ZTimelineProjectsData.shape.status.shape[lang].options,
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
    createZodDb(ZTimelineExperiencesData).omit({ mdContents: true })
  ),
  [ZETimelineElements.enum.projects]: z.array(
    createZodDb(ZTimelineProjectsData).omit({ mdContents: true })
  ),
  [ZETimelineElements.enum.studies]: z.array(
    createZodDb(ZTimelineStudiesData).omit({ mdContents: true })
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
  IPartialTimelineData,
  IDbTimelineDataNoMd,
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
  ZPartialTimelineData,
  ZDbTimelineDataNoMd,
};
