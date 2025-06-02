import { z } from "zod/v4";
import { DisplayNameSchema, ZDisplayName } from "./IDisplayName.js";
import {
  IProgrammingLanguageOut,
  programmingLanguagesMapping,
  ZEProgrammingLanguagesIn,
} from "./IProgrammingLanguage.js";
import { RepoDescriptionSchema, ZRepoDescription } from "./IRepoDescription.js";
import mongoose, { Types } from "mongoose";
import { frameworksCSSMapping, ZEFrameworksCSSIn } from "./IFrameworkCSS.js";
import {
  frameworksJavascriptMapping,
  ZEFrameworksJavascriptIn,
} from "./IFrameworkJavascript.js";
import {
  frameworksKotlinMapping,
  ZEFrameworksKotlinIn,
} from "./IFrameworkKotlin.js";
import {
  frameworksPythonMapping,
  ZEFrameworksPythonIn,
} from "./IFrameworkPython.js";
import { platformsMapping, ZEPlatformsIn } from "./IPlatform.js";
import ICheckOutFramework from "./ICheckOutFramework.js";
import { frameworksHTMLMapping, ZEFrameworksHTMLIn } from "./IFrameworkHTML.js";

const ZRepoIn = z.object({
  displayName: ZDisplayName,
  owner: z.string(),
  repo: z.string(),
  path: z.string(),
  description: ZRepoDescription,
  programmingLanguages: z.array(ZEProgrammingLanguagesIn),
  frameworksJavascript: z.array(ZEFrameworksJavascriptIn).optional(),
  frameworksKotlin: z.array(ZEFrameworksKotlinIn).optional(),
  frameworksPython: z.array(ZEFrameworksPythonIn).optional(),
  frameworksCSS: z.array(ZEFrameworksCSSIn).optional(),
  frameworksHTML: z.array(ZEFrameworksHTMLIn).optional(),
  platforms: z.array(ZEPlatformsIn),
  youtube: z.string(),
  github: z.string(),
});

type IRepoIn = z.infer<typeof ZRepoIn>;

const ZDbRepo = ZRepoIn.extend({
  _id: z.instanceof(Types.ObjectId),
});

type IDbRepo = z.infer<typeof ZDbRepo>;

const ZRepoOut = ZDbRepo.transform((repo) => {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    frameworksJavascript,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    frameworksKotlin,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    frameworksPython,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    frameworksCSS,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    frameworksHTML,
    ...repoWithoutFrameworks
  } = repo;

  return {
    ...repoWithoutFrameworks,
    programmingLanguages: repo.programmingLanguages.map(
      (
        language
      ): IProgrammingLanguageOut & { frameworks: ICheckOutFramework[] } => {
        switch (language) {
          case "JAVASCRIPT":
            return {
              ...programmingLanguagesMapping[language],
              frameworks:
                repo.frameworksJavascript?.map(
                  (framework) => frameworksJavascriptMapping[framework]
                ) || [],
            };
          case "CSS":
            return {
              ...programmingLanguagesMapping[language],
              frameworks:
                repo.frameworksCSS?.map(
                  (framework) => frameworksCSSMapping[framework]
                ) || [],
            };
          case "HTML":
            return {
              ...programmingLanguagesMapping[language],
              frameworks:
                repo.frameworksHTML?.map(
                  (framework) => frameworksHTMLMapping[framework]
                ) || [],
            };
          case "KOTLIN":
            return {
              ...programmingLanguagesMapping[language],
              frameworks:
                repo.frameworksKotlin?.map(
                  (framework) => frameworksKotlinMapping[framework]
                ) || [],
            };
          case "PYTHON":
            return {
              ...programmingLanguagesMapping[language],
              frameworks:
                repo.frameworksPython?.map(
                  (framework) => frameworksPythonMapping[framework]
                ) || [],
            };
        }
      }
    ),
    platforms: repo.platforms.map((platform) => platformsMapping[platform]),
  };
});

type IRepoOut = z.infer<typeof ZRepoOut>;

const RepoSchema = new mongoose.Schema<IRepoIn>(
  {
    displayName: {
      type: DisplayNameSchema,
      required: true,
    },
    owner: {
      type: String,
      required: true,
    },
    repo: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    description: {
      type: RepoDescriptionSchema,
      required: true,
    },
    programmingLanguages: [
      {
        type: String,
        enum: ZEProgrammingLanguagesIn.options,
        required: true,
      },
    ],
    frameworksJavascript: [
      {
        type: String,
        enum: ZEFrameworksJavascriptIn.options,
      },
    ],
    frameworksKotlin: [
      {
        type: String,
        enum: ZEFrameworksKotlinIn.options,
      },
    ],
    frameworksPython: [
      {
        type: String,
        enum: ZEFrameworksPythonIn.options,
      },
    ],
    frameworksCSS: [
      {
        type: String,
        enum: ZEFrameworksCSSIn.options,
      },
    ],
    platforms: [
      {
        type: String,
        enum: ZEPlatformsIn.options,
        required: true,
      },
    ],
    youtube: {
      type: String,
      required: true,
    },
    github: {
      type: String,
      required: true,
    },
  },
  { _id: true }
);

export type { IRepoIn, IRepoOut, IDbRepo };
export { ZRepoIn, ZRepoOut, RepoSchema, ZDbRepo };
