import matter from "gray-matter";
import z, { ZodSafeParseResult, ZodType } from "zod/v4";
import IDocToC from "../models/IDocToc";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkGithubAlerts from "remark-github-alerts";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { rehypeToc } from "./rehypeToc.js";
import rehypeStringify from "rehype-stringify";
import { IContent } from "../models/IMatter";

const getContent = async <ZT extends ZodType>(
  mdContent: string,
  MatterContentZodType?: ZT
): Promise<IContent<z.infer<ZT>> | null> => {
  const unsafeMatterContent = matter(mdContent);

  let matterContentDataParseResult: ZodSafeParseResult<unknown> | undefined =
    undefined;
  if (MatterContentZodType) {
    matterContentDataParseResult = MatterContentZodType.safeParse(
      unsafeMatterContent.data
    );

    if (!matterContentDataParseResult.success) {
      return null;
    }
  }

  const matterContent = {
    ...unsafeMatterContent,
    data: matterContentDataParseResult?.data || unsafeMatterContent.data,
  };

  const tableOfContents: IDocToC[] = [];

  const processedContent = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkGithubAlerts)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeHighlight)
    .use(rehypeAutolinkHeadings, {
      behavior: "wrap",
      properties: {
        className: ["anchor-link"],
      },
    })
    .use(rehypeToc(tableOfContents))
    .use(rehypeStringify)
    .process(matterContent.content);

  const content: IContent<z.infer<ZT>> = {
    htmlContent: processedContent.toString(),
    matterContent: matterContent.data,
    tableOfContents,
  };
  return content;
};

export { getContent };
