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
import { rehypeAddClass, rehypeToc } from "./rehypeExtensions.js";
import rehypeStringify from "rehype-stringify";
import { IContent } from "../models/IMatter";
import rehypeExternalLinks from "rehype-external-links";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

const getContent = async <ZT extends ZodType>(
  mdContent: string,
  MatterContentZodType?: ZT,
  transformHtmlContent?: (htmlContent: string) => string
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
    .use(remarkMath)
    .use(remarkGfm)
    .use(remarkGithubAlerts)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeHighlight)
    .use(rehypeKatex, {
      output: "html",
      strict: false,
      trust: true,
      macros: {
        "\\RR": "\\mathbb{R}",
        "\\NN": "\\mathbb{N}",
      },
    })
    .use(rehypeAddClass, {
      mapping: [
        { className: "basic-link", tagName: "a" },
        { className: "md-ul", tagName: "ul" },
        { className: "responsive-table", tagName: "table" },
      ],
    }) // Before rehypeAutolinkHeadings because we don't want the class in the headings
    .use(rehypeAutolinkHeadings, {
      behavior: "wrap",
      properties: {
        className: ["anchor-link"],
      },
    })
    .use(rehypeExternalLinks, {
      rel: ["nofollow", "noopener"],
      target: "_blank",
      content: {
        type: "element",
        tagName: "span",
        properties: { className: ["sr-only"] },
        children: [{ type: "text", value: " (opens in new window)" }],
      },
    })
    .use(rehypeToc(tableOfContents))
    .use(rehypeStringify)
    .process(matterContent.content);

  const transformedHtmlContent =
    transformHtmlContent && transformHtmlContent(processedContent.toString());

  const content: IContent<z.infer<ZT>> = {
    htmlContent: transformedHtmlContent || processedContent.toString(),
    matterContent: matterContent.data,
    tableOfContents,
  };
  return content;
};

export { getContent };
