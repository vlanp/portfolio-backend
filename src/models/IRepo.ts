import { z } from "zod/v4";
import { DisplayNameSchema, ZDisplayName } from "./IDisplayName.js";
import {
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
  platforms: z.array(ZEPlatformsIn),
  youtube: z.string(),
  github: z.string(),
});

const ZRepoOut = ZRepoIn.transform((repo) => ({
  ...repo,
  programmingLanguages: repo.programmingLanguages.map(
    (language) => programmingLanguagesMapping[language]
  ),
  frameworksJavascript: repo.frameworksJavascript?.map(
    (framework) => frameworksJavascriptMapping[framework]
  ),
  frameworksKotlin: repo.frameworksKotlin?.map(
    (framework) => frameworksKotlinMapping[framework]
  ),
  frameworksPython: repo.frameworksPython?.map(
    (framework) => frameworksPythonMapping[framework]
  ),
  frameworksCSS: repo.frameworksCSS?.map(
    (framework) => frameworksCSSMapping[framework]
  ),
  platforms: repo.platforms.map((platform) => platformsMapping[platform]),
}));

type IRepoIn = z.infer<typeof ZRepoIn>;

type IDBRepoIn = IRepoIn & {
  _id: Types.ObjectId;
};

type IRepoOut = z.infer<typeof ZRepoOut>;

const RepoSchema = new mongoose.Schema<IDBRepoIn>(
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
    _id: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { _id: true }
);

export type { IRepoIn, IRepoOut, IDBRepoIn };
export { ZRepoIn, ZRepoOut, RepoSchema };
