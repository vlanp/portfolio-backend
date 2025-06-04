import mongoose, { HydratedDocument, Model, Types } from "mongoose";
import {
  getFrameworksFromRepo,
  IDbRepo,
  RepoSchema,
  ZDbRepo,
  ZRepoIn,
  ZRepoOut,
} from "./IRepo.js";
import z from "zod/v4";
import { arrayDistinct, isStringArray } from "../utils/array.js";
import {
  IProgrammingLanguageOut,
  programmingLanguagesMapping,
} from "./IProgrammingLanguage.js";
import { IPlaformOut, platformsMapping } from "./IPlatform.js";

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
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type IProjectModel = Model<IDbProject, {}, {}, {}, IHydratedProjectDocument>;

const ProjectSchema = new mongoose.Schema<IProjectIn, IProjectModel>(
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

const Project = mongoose.model<IProjectIn, IProjectModel>(
  "Project",
  ProjectSchema
);

function getAllFrameworksFromProjects(projects: IProjectOut[]): string[] {
  const allFrameworks = new Set<string>();

  projects.forEach((project) => {
    project.repos.forEach((repo) => {
      const repoFrameworks = getFrameworksFromRepo(repo);
      repoFrameworks.forEach((framework) => allFrameworks.add(framework));
    });
  });

  return Array.from(allFrameworks);
}

function getAllProgrammingLanguagesFromProjects(
  projects: IProjectIn[] | IProjectOut[] | IDbProject[]
): IProgrammingLanguageOut["name"][] {
  return arrayDistinct(
    projects.flatMap((project) =>
      project.repos.flatMap((repo) => {
        const programmingLanguages = repo.programmingLanguages;
        if (isStringArray(programmingLanguages)) {
          return programmingLanguages.map(
            (it) => programmingLanguagesMapping[it].name
          );
        } else {
          return programmingLanguages.map((it) => it.name);
        }
      })
    )
  );
}

function getAllPlatformsFromProjects(
  projects: IProjectIn[] | IProjectOut[] | IDbProject[]
): IPlaformOut["name"][] {
  return arrayDistinct(
    projects.flatMap((project) =>
      project.repos.flatMap((repo) => {
        const platforms = repo.platforms;
        if (isStringArray(platforms)) {
          return platforms.map((it) => platformsMapping[it].name);
        } else {
          return platforms.map((it) => it.name);
        }
      })
    )
  );
}

export type { IProjectIn, IProjectOut, IDbProject };
export {
  Project,
  ProjectSchema,
  ZProjectIn,
  ZProjectOut,
  getAllFrameworksFromProjects,
  getAllProgrammingLanguagesFromProjects,
  getAllPlatformsFromProjects,
};
