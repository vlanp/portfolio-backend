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
import {
  extractSearchPaths,
  IExtractSearchPaths,
  ITypedSearchIndex,
} from "../utils/mongooseSearchPaths.js";
import { ILang, langs } from "./ILocalized.js";

const ZProjectIn = z.strictObject({
  name: z.string(),
  repos: z.array(ZRepoIn),
  isFullStack: z.boolean(),
});

type IProjectIn = z.infer<typeof ZProjectIn>;

const ZDbProject = z.strictObject({
  ...ZProjectIn.shape,
  _id: z.instanceof(Types.ObjectId),
  createdAt: z.instanceof(Date),
  updatedAt: z.instanceof(Date),
  __v: z.number(),
  repos: z.array(ZDbRepo),
});

type IDbProject = z.infer<typeof ZDbProject>;

const ZProjectOut = z.strictObject({
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
    autoSearchIndex: true,
  }
);

const ProjectSearchIndex = {
  name: "ProjectsSearch",
  definition: {
    analyzer: "lucene.standard",
    searchAnalyzer: "lucene.standard",
    mappings: {
      dynamic: false,
      fields: {
        name: {
          type: "autocomplete",
        },
        repos: {
          fields: {
            description: {
              fields: {
                en: {
                  type: "autocomplete",
                  analyzer: "lucene.english",
                },
                fr: {
                  type: "autocomplete",
                  analyzer: "lucene.french",
                },
              },
              type: "document",
            },
            displayName: {
              fields: {
                name: {
                  type: "autocomplete",
                },
              },
              type: "document",
            },
          },
          type: "document",
        },
      },
    },
  },
  type: "search",
} as const satisfies ITypedSearchIndex<IDbProject>;

ProjectSchema.searchIndex(ProjectSearchIndex);

const projectSearchPaths = langs.reduce(
  (acc, l) => {
    acc[l] = extractSearchPaths<
      IDbProject,
      ITypedSearchIndex<IDbProject>,
      ILang
    >(ProjectSearchIndex, l);
    return acc;
  },
  {} as {
    [T in ILang]: IExtractSearchPaths<
      IDbProject,
      ITypedSearchIndex<IDbProject>,
      ILang
    >;
  }
);

const projectSearchPathsArray = langs.map((l) =>
  extractSearchPaths<IDbProject, ITypedSearchIndex<IDbProject>, ILang>(
    ProjectSearchIndex,
    l
  )
);

type IProjectSearchPath =
  (typeof projectSearchPathsArray)[number][keyof (typeof projectSearchPathsArray)[number]];

ProjectSchema.searchIndex(ProjectSearchIndex);

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

export type { IProjectIn, IProjectOut, IDbProject, IProjectSearchPath };
export {
  Project,
  ProjectSchema,
  ZProjectIn,
  ZProjectOut,
  getAllFrameworksFromProjects,
  getAllProgrammingLanguagesFromProjects,
  getAllPlatformsFromProjects,
  ProjectSearchIndex,
  projectSearchPaths,
  projectSearchPathsArray,
};
