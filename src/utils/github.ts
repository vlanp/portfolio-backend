import { Octokit } from "octokit";
import type { Octokit as OctokitType } from "octokit";
import { IRepo } from "../models/IRepo.js";

type IOctokitContentResponse = Awaited<
  ReturnType<OctokitType["rest"]["repos"]["getContent"]>
>;

type IOctokitTagsResponse = Awaited<
  ReturnType<OctokitType["rest"]["repos"]["listTags"]>
>;

type IOctokitTreeResponse = Awaited<
  ReturnType<OctokitType["rest"]["git"]["getTree"]>
>;

const octokit = new Octokit({
  auth: process.env.PUBLIC_RESOURCES_TOKEN,
});

const getTags = async (repo: IRepo): Promise<IOctokitTagsResponse> => {
  const tags = await octokit.rest.repos.listTags({
    owner: repo.owner,
    repo: repo.repo,
  });
  return tags;
};

const getTree = async (
  repo: IRepo,
  sha: string
): Promise<IOctokitTreeResponse> => {
  const tree = await octokit.rest.git.getTree({
    owner: repo.owner,
    repo: repo.repo,
    tree_sha: sha,
    recursive: "true",
  });
  const docsItems = tree.data.tree.filter(
    (item) => item.path.startsWith("docs/") || item.path === "docs"
  );

  const result = {
    ...tree,
    data: {
      ...tree.data,
      tree: docsItems,
    },
  };

  return result;
};

export { getTags, getTree };
export type {
  IOctokitContentResponse,
  IOctokitTagsResponse,
  IOctokitTreeResponse,
};
