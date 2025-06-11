import mongoose, { Types } from "mongoose";
import { getFrameworksFromRepo, RepoSchema, ZDbRepo, ZRepoIn, ZRepoOut, } from "./IRepo.js";
import z from "zod/v4";
import { arrayDistinct, isStringArray } from "../utils/array.js";
import { platformsMapping } from "./IPlatform.js";
import { extractSearchPaths, } from "../utils/mongooseSearchPaths.js";
import { langs } from "./ILocalized.js";
const ZProjectIn = z.strictObject({
    name: z.string(),
    repos: z.array(ZRepoIn),
    isFullStack: z.boolean(),
});
const ZDbProject = z.strictObject({
    ...ZProjectIn.shape,
    _id: z.instanceof(Types.ObjectId),
    createdAt: z.instanceof(Date),
    updatedAt: z.instanceof(Date),
    __v: z.number(),
    repos: z.array(ZDbRepo),
});
const ZProjectOut = z.strictObject({
    ...ZDbProject.shape,
    repos: z.array(ZRepoOut),
});
const ProjectSchema = new mongoose.Schema({
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
}, {
    timestamps: true,
    _id: true,
});
const ProjectSearchIndex = {
    name: "ProjectsSearch",
    definition: {
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
                                },
                                fr: {
                                    type: "autocomplete",
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
};
ProjectSchema.searchIndex(ProjectSearchIndex);
const projectSearchPaths = langs.reduce((acc, l) => {
    acc[l] = extractSearchPaths(ProjectSearchIndex, "autocomplete", l);
    return acc;
}, {});
const Project = mongoose.model("Project", ProjectSchema);
function getAllFrameworksFromProjects(projects) {
    const allFrameworks = new Set();
    projects.forEach((project) => {
        project.repos.forEach((repo) => {
            const repoFrameworks = getFrameworksFromRepo(repo);
            repoFrameworks.forEach((framework) => allFrameworks.add(framework));
        });
    });
    return Array.from(allFrameworks);
}
function getAllProgrammingLanguagesFromProjects(projects) {
    const languageMap = new Map();
    projects.forEach((project) => {
        project.repos.forEach((repo) => {
            repo.programmingLanguages.forEach((lang) => {
                if (!languageMap.has(lang.name)) {
                    languageMap.set(lang.name, new Set());
                }
                lang.frameworks.forEach((framework) => {
                    languageMap.get(lang.name).add(framework.name);
                });
            });
        });
    });
    return Array.from(languageMap.entries()).map(([name, frameworksSet]) => ({
        name,
        frameworks: Array.from(frameworksSet).sort(),
    }));
}
function getAllPlatformsFromProjects(projects) {
    return arrayDistinct(projects.flatMap((project) => project.repos.flatMap((repo) => {
        const platforms = repo.platforms;
        if (isStringArray(platforms)) {
            return platforms.map((it) => platformsMapping[it].name);
        }
        else {
            return platforms.map((it) => it.name);
        }
    })));
}
export { Project, ProjectSchema, ZProjectIn, ZProjectOut, getAllFrameworksFromProjects, getAllProgrammingLanguagesFromProjects, getAllPlatformsFromProjects, ProjectSearchIndex, projectSearchPaths, };
