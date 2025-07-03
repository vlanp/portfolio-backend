import { GrayMatterFile } from "gray-matter";
import IDocToC from "./IDocToc";

type IGrayMatterFile<H> = GrayMatterFile<string> & {
  data: H;
};

interface IContent<H = unknown> {
  htmlContent: string;
  matterContent: IGrayMatterFile<H>["data"];
  tableOfContents: IDocToC[];
}

interface IContentWithExtraData<ED> extends IContent {
  extraData: ED;
}

export type { IGrayMatterFile, IContent, IContentWithExtraData };
