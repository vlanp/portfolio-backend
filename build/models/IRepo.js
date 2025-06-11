import { z } from "zod/v4";
import { DisplayNameSchema, ZDisplayName } from "./IDisplayName.js";
import { programmingLanguagesMapping, ZEProgrammingLanguagesIn, } from "./IProgrammingLanguage.js";
import { RepoDescriptionSchema, ZRepoDescription } from "./IRepoDescription.js";
import mongoose, { Types } from "mongoose";
import { frameworksCSSMapping, ZEFrameworksCSSIn } from "./IFrameworkCSS.js";
import { frameworksJavascriptMapping, ZEFrameworksJavascriptIn, } from "./IFrameworkJavascript.js";
import { frameworksKotlinMapping, ZEFrameworksKotlinIn, } from "./IFrameworkKotlin.js";
import { frameworksPythonMapping, ZEFrameworksPythonIn, } from "./IFrameworkPython.js";
import { platformsMapping, ZEPlatformsIn } from "./IPlatform.js";
import { frameworksHTMLMapping, ZEFrameworksHTMLIn } from "./IFrameworkHTML.js";
const ZRepoIn = z.object({
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
ZRepoIn.required()._input;
const frameworksIn = (() => {
    const keys = Object.keys(ZRepoIn.shape).filter((key) => key.startsWith("frameworks"));
    return keys
        .map((key) => ZRepoIn.shape[key].unwrap().element.options) // Unwrap optional to make the enum available
        .flat()
        .filter((framework) => framework !== undefined);
})();
function findMatchingFrameworkKey(programmingLanguage) {
    const searchKey = `frameworks${programmingLanguage}`;
    const foundKey = Object.keys(ZRepoIn.shape).find((key) => key.toLowerCase() === searchKey.toLowerCase());
    if (!foundKey) {
        throw new Error(`No matching framework key found for ${programmingLanguage}`);
    }
    return foundKey;
}
function findMatchingFrameworksValues(frameworkKey, frameworks) {
    return frameworks.map((framework) => {
        const parts = framework.match(/[A-Za-z0-9]+/g);
        if (!parts) {
            throw new Error(`Invalid framework format: ${framework}`);
        }
        const validFrameworks = ZRepoIn.shape[frameworkKey].unwrap().element.options;
        if (!validFrameworks) {
            throw new Error(`No valid frameworks found for key ${frameworkKey} in ZRepoIn`);
        }
        const correspondingFramework = validFrameworks.find((validFramework) => parts.every((part) => new RegExp(part, "i").test(validFramework)));
        if (!correspondingFramework) {
            throw new Error(`No corresponding framework found for ${framework} in ${JSON.stringify(validFrameworks)}`);
        }
        return correspondingFramework;
    });
}
const ZDbRepo = z.object({
    ...ZRepoIn.shape,
    _id: z.instanceof(Types.ObjectId),
});
const ZPickedRepoIn = ZRepoIn.pick({
    programmingLanguages: true,
    frameworksJavaScript: true,
    frameworksKotlin: true,
    frameworksPython: true,
    frameworksCSS: true,
    frameworksHTML: true,
    platforms: true,
});
const ZRepoTransformFunction = (repo) => {
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
    platforms, ...repoWithoutFrameworks } = repo;
    return {
        ...repoWithoutFrameworks,
        programmingLanguages: repo.programmingLanguages.map((language) => {
            switch (language) {
                case "JAVASCRIPT":
                    return {
                        ...programmingLanguagesMapping[language],
                        frameworks: repo.frameworksJavaScript?.map((framework) => frameworksJavascriptMapping[framework]) || [],
                    };
                case "CSS":
                    return {
                        ...programmingLanguagesMapping[language],
                        frameworks: repo.frameworksCSS?.map((framework) => frameworksCSSMapping[framework]) || [],
                    };
                case "HTML":
                    return {
                        ...programmingLanguagesMapping[language],
                        frameworks: repo.frameworksHTML?.map((framework) => frameworksHTMLMapping[framework]) || [],
                    };
                case "KOTLIN":
                    return {
                        ...programmingLanguagesMapping[language],
                        frameworks: repo.frameworksKotlin?.map((framework) => frameworksKotlinMapping[framework]) || [],
                    };
                case "PYTHON":
                    return {
                        ...programmingLanguagesMapping[language],
                        frameworks: repo.frameworksPython?.map((framework) => frameworksPythonMapping[framework]) || [],
                    };
            }
        }),
        platforms: repo.platforms.map((platform) => platformsMapping[platform]),
    };
};
const ZRepoOut = ZDbRepo.transform(ZRepoTransformFunction);
const frameworksOut = ZPickedRepoIn.transform(ZRepoTransformFunction)
    .parse({
    programmingLanguages: ZRepoIn.shape.programmingLanguages.element.options,
    frameworksJavaScript: ZRepoIn.shape.frameworksJavaScript.unwrap().element.options,
    frameworksKotlin: ZRepoIn.shape.frameworksKotlin.unwrap().element.options,
    frameworksPython: ZRepoIn.shape.frameworksPython.unwrap().element.options,
    frameworksCSS: ZRepoIn.shape.frameworksCSS.unwrap().element.options,
    frameworksHTML: ZRepoIn.shape.frameworksHTML.unwrap().element.options,
    platforms: ZRepoIn.shape.platforms.element.options,
})
    .programmingLanguages.flatMap((pl) => pl.frameworks.map((fw) => fw.name));
const RepoSchema = new mongoose.Schema({
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
}, { _id: true });
function getFrameworksFromRepo(repo) {
    const allFrameworks = [];
    repo.programmingLanguages.forEach((programmingLanguage) => allFrameworks.push(...programmingLanguage.frameworks.map((framework) => framework.name)));
    return allFrameworks;
}
export { ZRepoIn, ZRepoOut, RepoSchema, ZDbRepo, getFrameworksFromRepo, findMatchingFrameworkKey, findMatchingFrameworksValues, frameworksIn, frameworksOut, };
