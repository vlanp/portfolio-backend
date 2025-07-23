import { ZDocToc } from "./IDocToc.js";
import z from "zod/v4";

const getZContent = <ZMatterContent extends z.ZodType = z.ZodUnknown>(
  zMatterContent: ZMatterContent
) => {
  return z.object({
    htmlContent: z.string(),
    matterContent: zMatterContent,
    tableOfContents: ZDocToc.array(),
  });
};

type IContent<MatterContent> = z.infer<ReturnType<typeof getZContent>> & {
  matterContent: MatterContent;
};

const stringifyContent = (content: IContent<unknown>) => {
  return JSON.stringify(content);
};

const parseContent = (
  stringifiedContent: string,
  ZMatterContent: z.ZodType = z.unknown()
) => {
  const obj = JSON.parse(stringifiedContent);

  const contentParsedResult = getZContent(ZMatterContent).safeParse(obj);

  if (!contentParsedResult.success) {
    throw new Error(z.prettifyError(contentParsedResult.error));
  }

  return contentParsedResult.data;
};

interface IContentWithExtraData<ED> extends IContent<unknown> {
  extraData: ED;
}

export type { IContent, IContentWithExtraData };
export { getZContent, stringifyContent, parseContent };
