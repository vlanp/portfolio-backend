import { z } from "zod/v4";
import { DisplayNameSchema, ZDisplayName } from "./IDisplayName.js";
import { ZEFrameworksCSS } from "./IFrameworkCSS.js";
import { ZEFrameworksJavascript } from "./IFrameworkJavascript.js";
import { ZEFrameworksKotlin } from "./IFrameworkKotlin.js";
import { ZEFrameworksPython } from "./IFrameworkPython.js";
import { ZEPlatforms } from "./IPlatform.js";
import { ZEProgrammingLanguages } from "./IProgrammingLanguage.js";
import { RepoDescriptionSchema, ZRepoDescription } from "./IRepoDescription.js";
import mongoose from "mongoose";

const ZRepo = z.object({
  displayName: ZDisplayName,
  owner: z.string(),
  repo: z.string(),
  path: z.string(),
  description: ZRepoDescription,
  languages: z.array(ZEProgrammingLanguages),
  frameworksJavascript: z.array(ZEFrameworksJavascript).optional(),
  frameworksKotlin: z.array(ZEFrameworksKotlin).optional(),
  frameworksPython: z.array(ZEFrameworksPython).optional(),
  frameworksCSS: z.array(ZEFrameworksCSS).optional(),
  platforms: z.array(ZEPlatforms),
  youtube: z.string(),
  github: z.string(),
});

type IRepo = z.infer<typeof ZRepo>;

const RepoSchema = new mongoose.Schema<IRepo>({
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
  languages: [
    {
      type: String,
      enum: Object.values(ZEProgrammingLanguages.enum),
      required: true,
    },
  ],
  frameworksJavascript: [
    {
      type: String,
      enum: Object.values(ZEFrameworksJavascript.enum),
    },
  ],
  frameworksKotlin: [
    {
      type: String,
      enum: Object.values(ZEFrameworksKotlin.enum),
    },
  ],
  frameworksPython: [
    {
      type: String,
      enum: Object.values(ZEFrameworksPython.enum),
    },
  ],
  frameworksCSS: [
    {
      type: String,
      enum: Object.values(ZEFrameworksCSS.enum),
    },
  ],
  platforms: [
    {
      type: String,
      enum: Object.values(ZEPlatforms.enum),
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
});

export type { IRepo };
export { ZRepo, RepoSchema };
