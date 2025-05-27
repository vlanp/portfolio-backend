import mongoose, {
  HydratedArraySubdocument,
  HydratedDocument,
  Model,
  Types,
} from "mongoose";
import { IDbRepo, RepoSchema, ZDbRepo, ZRepoIn, ZRepoOut } from "./IRepo.js";
import z from "zod/v4";

const ZProjectIn = z.object({
  name: z.string(),
  repos: z.array(ZRepoIn),
  isFullStack: z.boolean(),
});

type IProjectIn = z.infer<typeof ZProjectIn>;

const ZDbProject = ZProjectIn.extend({
  _id: z.instanceof(Types.ObjectId),
  createdAt: z.instanceof(Date),
  updatedAt: z.instanceof(Date),
  __v: z.number(),
  repos: z.array(ZDbRepo),
});

type IDbProject = z.infer<typeof ZDbProject>;

const ZProjectOut = ZDbProject.extend({
  repos: z.array(ZRepoOut),
});

type IProjectOut = z.infer<typeof ZProjectOut>;

type IHydratedProjectDocument = HydratedDocument<
  IDbProject & {
    repos: Types.DocumentArray<IDbRepo>;
  }
>;
type IProjectModel = Model<IDbProject, {}, {}, {}, IHydratedProjectDocument>;

const ProjectSchema = new mongoose.Schema<IDbProject, IProjectModel>(
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

const Project = mongoose.model<IDbProject, IProjectModel>(
  "Project",
  ProjectSchema
);

export type { IProjectIn, IProjectOut, IDbProject };
export { Project, ProjectSchema, ZProjectIn, ZProjectOut };
