import express, { Request } from "express";
import {
  getAllPlatformsFromProjects,
  getAllProgrammingLanguagesFromProjects,
  IDbProject,
  IProjectIn,
  IProjectOut,
  Project,
  ProjectSearchIndex,
  projectSearchPaths,
  ZProjectIn,
  ZProjectOut,
} from "../models/IProject.js";
import isAdmin from "../middlewares/isAdmin.js";
import {
  getContent,
  getDocsTree,
  getTags,
  IContent,
  IOctokitTagsResponse,
} from "../utils/github.js";
import { ITagContent } from "../models/ITagContent.js";
import { isValidObjectId } from "mongoose";
import z, { ZodSafeParseResult } from "zod/v4";
import {
  IBadRequestResponse,
  ICreatedResponse,
  INotFoundResponse,
  IOkResponse,
} from "../models/ITypedResponse.js";
import {
  findMatchingFrameworkKey,
  findMatchingFrameworksValues,
  IRepoOut,
  ZRepoOut,
} from "../models/IRepo.js";
import { programmingLanguagesReverseMapping } from "../models/IProgrammingLanguage.js";
import { platformsReverseMapping } from "../models/IPlatform.js";
import {
  IAllProjectsFilters,
  ISelectedProjectsFilters,
  ZSelectedProjectsFilters,
} from "../models/IProjectsFilters.js";
import { arrayDistinctBy } from "../utils/array.js";
import { searchDbWithIndex } from "../utils/mongooseSearch.js";

const router = express.Router();

router.post(
  "/project",
  isAdmin,
  async (
    req: Request,
    res: ICreatedResponse<IDbProject> | IBadRequestResponse
  ) => {
    if (!req.body) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "Request body is missing."
      );
      return;
    }
    const projectInParseResult: ZodSafeParseResult<IProjectIn> =
      ZProjectIn.safeParse(req.body);
    if (!projectInParseResult.success) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        z.prettifyError(projectInParseResult.error)
      );
      return;
    }

    const projectIn: IProjectIn = projectInParseResult.data;

    const existingRepos = await Project.find({
      $or: projectIn.repos.map((repo) => ({
        "repos.owner": repo.owner,
        "repos.repo": repo.repo,
      })),
    }).lean();

    if (existingRepos.length > 0) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "One or more Repos already exists"
      );
      return;
    }

    const newDbProject = new Project<IProjectIn>(projectIn);

    const addedProjectDb = await newDbProject.save();

    (res as ICreatedResponse<IDbProject>).responsesFunc.sendCreatedResponse(
      addedProjectDb,
      "Project added successfully into the database"
    );
  }
);

router.post(
  "/projects",
  async (
    req: Request,
    res: IBadRequestResponse | IOkResponse<IProjectOut[]>
  ) => {
    const body = req.body;

    let filters: ISelectedProjectsFilters | undefined = undefined;
    if (body && Object.keys(body).length !== 0) {
      const bodyParseResult = ZSelectedProjectsFilters.safeParse(body);
      if (!bodyParseResult.success) {
        (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
          z.prettifyError(bodyParseResult.error)
        );
        return;
      }
      filters = bodyParseResult.data;
    }
    let dbProjects: IDbProject[] = [];
    const dbProjectsPromises: Promise<IDbProject[]>[] = [];
    if (!filters) {
      dbProjects = await Project.find().lean();
    } else {
      const programmingLanguages = filters.programmingLanguages
        .map((programmingLanguage) => {
          return {
            name: {
              value:
                programmingLanguagesReverseMapping[
                  programmingLanguage.name.value
                ],
              isSelected: programmingLanguage.name.isSelected,
            },
            frameworks: programmingLanguage.frameworks,
          };
        })
        .filter((programmingLanguage) => programmingLanguage !== null);

      const selectedProgrammingLanguages = programmingLanguages
        .filter((pl) => pl.name.isSelected)
        .map((pl) => pl.name.value);

      const platforms = filters.platforms.map(
        (platform) => platformsReverseMapping[platform]
      );

      const search = filters.search;

      const dbFilters = [];
      if (selectedProgrammingLanguages.length > 0) {
        dbFilters.push({
          "repos.programmingLanguages": {
            [filters.filtersBehavior === "intersection" ? "$all" : "$in"]:
              selectedProgrammingLanguages,
          },
        });
      }
      if (platforms.length > 0) {
        dbFilters.push({
          "repos.platforms": {
            [filters.filtersBehavior === "intersection" ? "$all" : "$in"]:
              platforms,
          },
        });
      }
      programmingLanguages.forEach((pl, index) => {
        const frameworks = filters.programmingLanguages[index].frameworks;
        if (frameworks.length > 0) {
          dbFilters.push({
            [`repos.${findMatchingFrameworkKey(pl.name.value)}`]: {
              [filters.filtersBehavior === "intersection" ? "$all" : "$in"]:
                findMatchingFrameworksValues(
                  findMatchingFrameworkKey(pl.name.value),
                  frameworks
                ),
            },
          });
        }
      });

      if (search) {
        dbProjectsPromises.push(
          searchDbWithIndex(
            search,
            Project,
            ProjectSearchIndex.name,
            projectSearchPaths
          )
        );
      }

      if (!filters.filtersBehavior || filters.filtersBehavior === "union") {
        if (dbFilters.length > 0 || !search) {
          dbProjectsPromises.push(
            Project.find({
              $or: dbFilters,
            }).lean()
          );
        }
        const results = await Promise.all(dbProjectsPromises);
        dbProjects = arrayDistinctBy(results.flat(), (project) =>
          project._id.toString()
        );
      } else {
        if (dbFilters.length > 0 || !search) {
          dbProjectsPromises.push(
            Project.find({
              $and: dbFilters,
            }).lean()
          );
        }
        const results = await Promise.all(dbProjectsPromises);
        const firstResult = results[0];
        const secondResult: IDbProject[] | undefined = results[1] || undefined;
        if (!secondResult) {
          dbProjects = firstResult;
        } else {
          dbProjects = firstResult.filter((project) =>
            secondResult
              .map((project) => project._id.toString())
              .includes(project._id.toString())
          );
        }
      }
    }
    const projectsOutParseResults = dbProjects.map((dbProject) =>
      ZProjectOut.safeParse(dbProject)
    );
    const projectsOut: IProjectOut[] = projectsOutParseResults
      .filter((result) => result.success)
      .map((result) => result.data);
    (res as IOkResponse<IProjectOut[]>).responsesFunc.sendOkResponse(
      projectsOut
    );
  }
);

router.get(
  "/repo/:repoid/tag/:sha",
  async (
    req: Request,
    res: IOkResponse<ITagContent> | IBadRequestResponse | INotFoundResponse
  ) => {
    const { repoid, sha } = req.params;
    const { lang } = req.query;

    if (typeof lang !== "string") {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "lang query params must be a string"
      );
      return;
    }
    if (!isValidObjectId(repoid)) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "Invalid repo id"
      );
      return;
    }
    const repo = (
      await Project.findOne(
        { "repos._id": repoid },
        {
          "repos.$": 1,
          _id: 0,
        }
      ).lean()
    )?.repos[0];
    if (!repo) {
      (res as INotFoundResponse).responsesFunc.sendNotFoundResponse(
        "No repo found with id " + repoid
      );
      return;
    }
    const tags = await getTags(repo);
    const tag = tags.find((tag) => tag.commit.sha === sha);
    if (!tag) {
      (res as INotFoundResponse).responsesFunc.sendNotFoundResponse(
        "No tag found with sha " + sha
      );
      return;
    }
    const docsTree = await getDocsTree(repo, tag.commit.sha);
    let langTree = docsTree.tree.filter(
      (item) =>
        item.path.startsWith("docs/" + lang + "/") ||
        item.path === "docs" + "/" + lang
    );
    if (langTree.length === 0) {
      langTree = docsTree.tree;
    }
    const dirs = langTree.filter((item) => item.type === "tree");
    const files = langTree.filter(
      (item) =>
        item.type === "blob" &&
        (item.path.endsWith(".md") || item.path.endsWith(".mdx"))
    );
    const filesContentsPromises = files.map(async (file) => {
      const fileContent = await getContent(repo, file.path, tag.commit.sha);
      return fileContent
        ? { file, matterContent: fileContent.matterContent }
        : null;
    });
    const filesContents = (await Promise.all(filesContentsPromises)).filter(
      (fileContent) => fileContent !== null
    );
    const tagContent: ITagContent = {
      tag: tag,
      orderedTags: tags,
      orderedDirs: dirs
        .map((dir) => {
          const orderedFiles = filesContents
            .filter((fileContent) => {
              return (
                fileContent.file.path.split("/").slice(0, -1).join("/") ===
                dir.path
              );
            })
            .sort((a, b) => {
              const navA = a.matterContent.nav;
              const navB = b.matterContent.nav;
              if (
                navA &&
                Number.isInteger(navA) &&
                navB &&
                Number.isInteger(navB)
              ) {
                return navA - navB;
              }
              if (Number.isInteger(navA)) {
                return -1;
              }
              if (Number.isInteger(navB)) {
                return 1;
              }
              return 0;
            });
          return {
            dir: dir,
            orderedFiles: orderedFiles,
          };
        })
        .filter((dir) => dir.orderedFiles.length > 0)
        .sort((a, b) => {
          const navA = a.orderedFiles[0].matterContent.nav;
          const navB = b.orderedFiles[0].matterContent.nav;
          if (
            navA &&
            Number.isInteger(navA) &&
            navB &&
            Number.isInteger(navB)
          ) {
            return navA - navB;
          }
          if (Number.isInteger(navA)) {
            return -1;
          }
          if (Number.isInteger(navB)) {
            return 1;
          }
          return 0;
        }),
    };

    (res as IOkResponse<ITagContent>).responsesFunc.sendOkResponse(tagContent);
  }
);

router.get(
  "/repo/:repoid",
  async (
    req: Request,
    res: IBadRequestResponse | IOkResponse<IRepoOut> | INotFoundResponse
  ) => {
    const { repoid } = req.params;
    if (!isValidObjectId(repoid)) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "Invalid repo id"
      );
      return;
    }
    const dbRepo = (
      await Project.findOne(
        { "repos._id": repoid },
        {
          "repos.$": 1,
          _id: 0,
        }
      ).lean()
    )?.repos[0];
    if (!dbRepo) {
      (res as INotFoundResponse).responsesFunc.sendNotFoundResponse(
        "No repo found with id " + repoid
      );
      return;
    }
    const repoOutParseResult = ZRepoOut.safeParse(dbRepo);
    if (!repoOutParseResult.success) {
      throw new Error(
        "Failed to parse and transform Repo from db into RepoOut."
      );
    }
    (res as IOkResponse<IRepoOut>).responsesFunc.sendOkResponse(
      repoOutParseResult.data
    );
  }
);

router.get(
  "/repo/:repoid/tags",
  async (
    req: Request,
    res:
      | IBadRequestResponse
      | INotFoundResponse
      | IOkResponse<IOctokitTagsResponse["data"]>
  ) => {
    const { repoid } = req.params;
    if (!isValidObjectId(repoid)) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "Invalid repo id"
      );
      return;
    }
    const repo = (
      await Project.findOne(
        { "repos._id": repoid },
        {
          "repos.$": 1,
          _id: 0,
        }
      ).lean()
    )?.repos[0];
    if (!repo) {
      (res as INotFoundResponse).responsesFunc.sendNotFoundResponse(
        "No repo found with id " + repoid
      );
      return;
    }
    const tags = await getTags(repo);
    (
      res as IOkResponse<IOctokitTagsResponse["data"]>
    ).responsesFunc.sendOkResponse(tags);
  }
);

router.get(
  "/repo/:repoid/fileContent/:filepath",
  async (
    req: Request,
    res: IBadRequestResponse | INotFoundResponse | IOkResponse<IContent>
  ) => {
    const { repoid, filepath } = req.params;
    const { ref } = req.query;
    if (typeof ref !== "string") {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "ref query params must be a string"
      );
      return;
    }
    if (!isValidObjectId(repoid)) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "Invalid repo id"
      );
      return;
    }
    const repo = (
      await Project.findOne(
        { "repos._id": repoid },
        {
          "repos.$": 1,
          _id: 0,
        }
      ).lean()
    )?.repos[0];
    if (!repo) {
      (res as INotFoundResponse).responsesFunc.sendNotFoundResponse(
        "No repo found with id " + repoid
      );
      return;
    }
    const fileContent = await getContent(repo, filepath, ref);
    if (!fileContent) {
      (res as INotFoundResponse).responsesFunc.sendNotFoundResponse(
        "No file found with path " + filepath
      );
      return;
    }
    (res as IOkResponse<IContent>).responsesFunc.sendOkResponse(fileContent);
  }
);

router.get(
  "/repo/:repoid/didFileExist/:filepath",
  async (
    req: Request,
    res:
      | IBadRequestResponse
      | INotFoundResponse
      | IOkResponse<{ exist: boolean }>
      | IOkResponse<{ exist: boolean; filePath: string }>
  ) => {
    const { repoid, filepath } = req.params;

    const { sha, lang } = req.query;
    if (typeof sha !== "string") {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "sha query params must be a string"
      );
      return;
    }
    if (typeof lang !== "string") {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "lang query params must be a string"
      );
      return;
    }
    if (!isValidObjectId(repoid)) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "Invalid repo id"
      );
      return;
    }
    const repo = (
      await Project.findOne(
        { "repos._id": repoid },
        {
          "repos.$": 1,
          _id: 0,
        }
      ).lean()
    )?.repos[0];
    if (!repo) {
      (res as INotFoundResponse).responsesFunc.sendNotFoundResponse(
        "No repo found with id " + repoid
      );
      return;
    }
    const docsTree = await getDocsTree(repo, sha);
    const files = docsTree.tree.filter(
      (item) =>
        item.type === "blob" &&
        (item.path.endsWith(".md") || item.path.endsWith(".mdx"))
    );
    const langFiles = files.filter(
      (item) =>
        item.path.startsWith("docs/" + lang + "/") ||
        item.path === "docs" + "/" + lang
    );
    if (langFiles.length === 0) {
      if (files.map((it) => it.path).includes(filepath)) {
        (res as IOkResponse<{ exist: boolean }>).responsesFunc.sendOkResponse({
          exist: true,
        });
        return;
      }
    } else if (langFiles.map((it) => it.path).includes(filepath)) {
      (res as IOkResponse<{ exist: boolean }>).responsesFunc.sendOkResponse({
        exist: true,
      });
      return;
    } else if (files.map((it) => it.path).includes(filepath)) {
      const filesContentsPromises = files.map(async (it) => {
        const fileContent = await getContent(repo, it.path, sha);
        return fileContent
          ? {
              fileContent,
              path: it.path,
            }
          : null;
      });
      const filesContents = (await Promise.all(filesContentsPromises)).filter(
        (it) => it !== null
      );
      const id = filesContents.find((it) => it.path === filepath)?.fileContent
        .matterContent.id;
      if (id) {
        const langFilesContents = filesContents.filter((fileContent) =>
          langFiles.map((it) => it.path).includes(fileContent.path)
        );
        const fileInLang = langFilesContents.find(
          (it) => it.fileContent.matterContent.id === id
        );
        if (fileInLang) {
          (
            res as IOkResponse<{ exist: boolean; filePath: string }>
          ).responsesFunc.sendOkResponse({
            exist: true,
            filePath: fileInLang.path,
          });
          return;
        }
      }
    }
    (res as IOkResponse<{ exist: boolean }>).responsesFunc.sendOkResponse({
      exist: false,
    });
  }
);

router.get(
  "/project/:repoid",
  async (
    req: Request,
    res: IBadRequestResponse | INotFoundResponse | IOkResponse<IProjectOut>
  ) => {
    const { repoid } = req.params;
    if (!isValidObjectId(repoid)) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        "Invalid repo id"
      );
      return;
    }
    const dbProject = await Project.findOne({ "repos._id": repoid }).lean();
    if (!dbProject) {
      (res as INotFoundResponse).responsesFunc.sendNotFoundResponse(
        "No repo found with id " + repoid
      );
      return;
    }
    const projectOutParseResult = ZProjectOut.safeParse(dbProject);
    if (!projectOutParseResult.success) {
      throw new Error(
        "Failed to parse and transform Project from db into ProjectOut."
      );
    }
    (res as IOkResponse<IProjectOut>).responsesFunc.sendOkResponse(
      projectOutParseResult.data
    );
  }
);

router.get(
  "/projects/filters",
  async (req: Request, res: IOkResponse<IAllProjectsFilters>) => {
    const dbProjects = await Project.find().lean();
    const projectsOutParseResults = dbProjects.map((dbProject) =>
      ZProjectOut.safeParse(dbProject)
    );
    const projectsOut: IProjectOut[] = projectsOutParseResults
      .filter((result) => result.success)
      .map((result) => result.data);
    const filters = {
      programmingLanguages: getAllProgrammingLanguagesFromProjects(projectsOut),
      platforms: getAllPlatformsFromProjects(projectsOut),
    };
    res.responsesFunc.sendOkResponse(filters);
  }
);

export default router;
