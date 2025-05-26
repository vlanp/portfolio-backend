import mongoose, {
  HydratedArraySubdocument,
  HydratedDocument,
  Model,
  Types,
} from "mongoose";
import { IDBRepoIn, RepoSchema, ZRepoIn, ZRepoOut } from "./IRepo.js";
import z from "zod/v4";

const ZProjectIn = z.object({
  name: z.string(),
  repos: z.array(ZRepoIn),
  isFullStack: z.boolean(),
});

type IProjectIn = z.infer<typeof ZProjectIn>;

type IDBProjectIn = IProjectIn & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
};

const ZProjectOut = z.object({
  name: z.string(),
  repos: z.array(ZRepoOut),
  isFullStack: z.boolean(),
});

type IProjectOut = z.infer<typeof ZProjectOut>;

type IHydratedProjectDocument = HydratedDocument<
  IDBProjectIn & {
    repos: HydratedArraySubdocument<IDBRepoIn>;
  }
>;
type IProjectModel = Model<IDBProjectIn, {}, {}, {}, IHydratedProjectDocument>;

const ProjectSchema = new mongoose.Schema<IDBProjectIn, IProjectModel>(
  {
    name: {
      type: String,
      required: true,
    },
    repos: {
      type: [RepoSchema],
      required: true,
    },
    isFullStack: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
    _id: true,
  }
);

const Project = mongoose.model<IDBProjectIn, IProjectModel>(
  "Project",
  ProjectSchema
);

export type { IProjectIn, IProjectOut };
export { Project, ProjectSchema, ZProjectIn, ZProjectOut };
