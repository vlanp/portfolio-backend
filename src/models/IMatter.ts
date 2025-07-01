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

export type { IGrayMatterFile, IContent };
