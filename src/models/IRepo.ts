import { z } from "zod/v4";
import { DisplayNameSchema, ZDisplayName } from "./IDisplayName.js";
import {
  IProgrammingLanguageIn,
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

type ICheckRepoIn = {
  [k in `frameworks${IProgrammingLanguageOut["name"]}`]: string[];
};

const ZRepoIn = z.strictObject({
  displayName: ZDisplayName,
  owner: z.string(),
  repo: z.string(),
  path: z.string(),
  description: ZRepoDescription,
  programmingLanguages: z.array(ZEProgrammingLanguagesIn),
  frameworksJavaScript: z.array(ZEFrameworksJavascriptIn).optional(),
  frameworksKotlin: z.array(ZEFrameworksKotlinIn).optional(),
  frameworksPython: z.array(ZEFrameworksPythonIn).optional(),
  frameworksCSS: z.array(ZEFrameworksCSSIn).optional(),
  frameworksHTML: z.array(ZEFrameworksHTMLIn).optional(),
  platforms: z.array(ZEPlatformsIn),
  youtube: z.string(),
  github: z.string(),
});

ZRepoIn.required()._input satisfies ICheckRepoIn;

type IRepoIn = z.infer<typeof ZRepoIn>;

type IFrameworkIn = NonNullable<
  IRepoIn[keyof IRepoIn & `frameworks${string}`]
>[number];

const frameworksIn: IFrameworkIn[] = (() => {
  const keys = Object.keys(ZRepoIn.shape).filter(
    (key): key is keyof IRepoIn & `frameworks${string}` =>
      key.startsWith("frameworks")
  );
  return keys
    .map((key) => ZRepoIn.shape[key].unwrap().element.options) // Unwrap optional to make the enum available
    .flat()
    .filter((framework) => framework !== undefined);
})();

function findMatchingFrameworkKey(
  programmingLanguage: IProgrammingLanguageIn | IProgrammingLanguageOut["name"]
): keyof IRepoIn & `frameworks${string}` {
  const searchKey = `frameworks${programmingLanguage}` as const;
  const foundKey = Object.keys(ZRepoIn.shape).find(
    (key): key is keyof IRepoIn & `frameworks${string}` =>
      key.toLowerCase() === searchKey.toLowerCase()
  );
  if (!foundKey) {
    throw new Error(
      `No matching framework key found for ${programmingLanguage}`
    );
  }
  return foundKey;
}

function findMatchingFrameworksValues(
  frameworkKey: keyof IRepoIn & `frameworks${string}`,
  frameworks: IFrameworkOut[]
) {
  return frameworks.map((framework) => {
    const parts = framework.match(/[A-Za-z0-9]+/g);
    if (!parts) {
      throw new Error(`Invalid framework format: ${framework}`);
    }

    const validFrameworks =
      ZRepoIn.shape[frameworkKey].unwrap().element.options;

    if (!validFrameworks) {
      throw new Error(
        `No valid frameworks found for key ${frameworkKey} in ZRepoIn`
      );
    }

    const correspondingFramework = validFrameworks.find((validFramework) =>
      parts.every((part) => new RegExp(part, "i").test(validFramework))
    );
    if (!correspondingFramework) {
      throw new Error(
        `No corresponding framework found for ${framework} in ${JSON.stringify(
          validFrameworks
        )}`
      );
    }
    return correspondingFramework;
  });
}

const ZDbRepo = z.strictObject({
  ...ZRepoIn.shape,
  _id: z.instanceof(Types.ObjectId),
});

type IDbRepo = z.infer<typeof ZDbRepo>;

const ZPickedRepoIn = ZRepoIn.pick({
  programmingLanguages: true,
  frameworksJavaScript: true,
  frameworksKotlin: true,
  frameworksPython: true,
  frameworksCSS: true,
  frameworksHTML: true,
  platforms: true,
});

type IPickedRepoIn = z.infer<typeof ZPickedRepoIn>;

const ZRepoTransformFunction = <T extends IPickedRepoIn>(repo: T) => {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    programmingLanguages,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    frameworksJavaScript,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    frameworksKotlin,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    frameworksPython,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    frameworksCSS,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    frameworksHTML,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    platforms,
    ...repoWithoutFrameworks
  } = repo;

  return {
    ...repoWithoutFrameworks,
    programmingLanguages: repo.programmingLanguages.map((language) => {
      switch (language) {
        case "JAVASCRIPT":
          return {
            ...programmingLanguagesMapping[language],
            frameworks:
              repo.frameworksJavaScript?.map(
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
    }) satisfies (IProgrammingLanguageOut & {
      frameworks: ICheckOutFramework[];
    })[],
    platforms: repo.platforms.map((platform) => platformsMapping[platform]),
  };
};

const ZRepoOut = ZDbRepo.transform(ZRepoTransformFunction);

type IRepoOut = z.infer<typeof ZRepoOut>;

type IFrameworkOut =
  IRepoOut["programmingLanguages"][number]["frameworks"][number]["name"];

const frameworksOut: IFrameworkOut[] = ZPickedRepoIn.transform(
  ZRepoTransformFunction
)
  .parse({
    programmingLanguages: ZRepoIn.shape.programmingLanguages.element.options,
    frameworksJavaScript:
      ZRepoIn.shape.frameworksJavaScript.unwrap().element.options,
    frameworksKotlin: ZRepoIn.shape.frameworksKotlin.unwrap().element.options,
    frameworksPython: ZRepoIn.shape.frameworksPython.unwrap().element.options,
    frameworksCSS: ZRepoIn.shape.frameworksCSS.unwrap().element.options,
    frameworksHTML: ZRepoIn.shape.frameworksHTML.unwrap().element.options,
    platforms: ZRepoIn.shape.platforms.element.options,
  } satisfies IPickedRepoIn)
  .programmingLanguages.flatMap((pl) => pl.frameworks.map((fw) => fw.name));

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
    frameworksJavaScript: [
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
    frameworksHTML: [
      {
        type: String,
        enum: ZEFrameworksHTMLIn.options,
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

function getFrameworksFromRepo(repo: IRepoOut): string[] {
  const allFrameworks: string[] = [];
  repo.programmingLanguages.forEach((programmingLanguage) =>
    allFrameworks.push(
      ...programmingLanguage.frameworks.map((framework) => framework.name)
    )
  );

  return allFrameworks;
}

export type { IRepoIn, IRepoOut, IDbRepo, IFrameworkIn, IFrameworkOut };
export {
  ZRepoIn,
  ZRepoOut,
  RepoSchema,
  ZDbRepo,
  getFrameworksFromRepo,
  findMatchingFrameworkKey,
  findMatchingFrameworksValues,
  frameworksIn,
  frameworksOut,
};
