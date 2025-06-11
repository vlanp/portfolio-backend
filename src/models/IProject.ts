import mongoose, { HydratedDocument, Model, Types } from "mongoose";
import {
  getFrameworksFromRepo,
  IDbRepo,
  IFrameworkOut,
  RepoSchema,
  ZDbRepo,
  ZRepoIn,
  ZRepoOut,
} from "./IRepo.js";
import z from "zod/v4";
import { arrayDistinct, isStringArray } from "../utils/array.js";
import { IPlaformOut, platformsMapping } from "./IPlatform.js";
import { IAllProjectsFilters } from "./IProjectsFilters.js";
import { IProgrammingLanguageOut } from "./IProgrammingLanguage.js";

const ZProjectIn = z.object({
  name: z.string(),
  repos: z.array(ZRepoIn),
  isFullStack: z.boolean(),
});

type IProjectIn = z.infer<typeof ZProjectIn>;

const ZDbProject = z.object({
  ...ZProjectIn.shape,
  _id: z.instanceof(Types.ObjectId),
  createdAt: z.instanceof(Date),
  updatedAt: z.instanceof(Date),
  __v: z.number(),
  repos: z.array(ZDbRepo),
});

type IDbProject = z.infer<typeof ZDbProject>;

const ZProjectOut = z.object({
  ...ZDbProject.shape,
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
  projects: IProjectOut[]
): IAllProjectsFilters["programmingLanguages"] {
  const languageMap = new Map<
    IProgrammingLanguageOut["name"],
    Set<IFrameworkOut>
  >();

  projects.forEach((project) => {
    project.repos.forEach((repo) => {
      repo.programmingLanguages.forEach((lang) => {
        if (!languageMap.has(lang.name)) {
          languageMap.set(lang.name, new Set<IFrameworkOut>());
        }

        lang.frameworks.forEach((framework) => {
          languageMap.get(lang.name)!.add(framework.name);
        });
      });
    });
  });

  return Array.from(languageMap.entries()).map(([name, frameworksSet]) => ({
    name,
    frameworks: Array.from(frameworksSet).sort(),
  }));
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
