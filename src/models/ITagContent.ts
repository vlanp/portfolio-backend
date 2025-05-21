import {
  IFrontMatterData,
  IGrayMatterFile,
  IOctokitTagsResponse,
  IOctokitTreeResponse,
} from "../utils/github.js";

interface ITagContent {
  orderedTags: IOctokitTagsResponse["data"];
  tag: IOctokitTagsResponse["data"][0];
  orderedDirs: IDir[];
}

interface IDir {
  dir: IOctokitTreeResponse["data"]["tree"][0];
  orderedFiles: IFile[];
}

interface IFile {
  file: IOctokitTreeResponse["data"]["tree"][0];
  matterContent: IGrayMatterFile<IFrontMatterData>["data"];
}

export type { ITagContent, IDir, IFile };
