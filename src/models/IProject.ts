import mongoose from "mongoose";
import { RepoSchema, ZRepo } from "./IRepo.js";
import z from "zod/v4";

const ZProject = z.object({
  name: z.string(),
  repos: z.array(ZRepo),
  isFullStack: z.boolean(),
});

type IProject = z.infer<typeof ZProject>;

const ProjectSchema = new mongoose.Schema<IProject>(
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
  }
);

const Project = mongoose.model<IProject>("Project", ProjectSchema);

export type { IProject };
export { Project, ProjectSchema, ZProject };
