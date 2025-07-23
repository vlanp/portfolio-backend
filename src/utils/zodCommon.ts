import { getContent } from "../utils/file.js";
import { transformRecordAsync } from "../utils/common.js";
import { ILang } from "../models/ILocalized.js";
import z from "zod/v4";
import { IContent } from "../models/IMatter.js";

const createHtmlContents = async <
  T extends { mdContents: Record<ILang, string> }
>(
  DataTypeIn: T,
  ctx: z.RefinementCtx<T>
): Promise<
  T & {
    htmlContents: Record<ILang, IContent<unknown>>;
  }
> => {
  const transformedRecord = await transformRecordAsync(
    DataTypeIn.mdContents,
    getContent
  );
  const htmlContents = Object.fromEntries(
    Object.entries(transformedRecord).map(([key, value]) => {
      if (!value) {
        ctx.issues.push({
          code: "custom",
          message: "No file content found",
          input: DataTypeIn,
        });
        return z.NEVER;
      }
      return [key, value] as [ILang, IContent<unknown>];
    })
  ) as Record<ILang, IContent<unknown>>;

  return {
    ...DataTypeIn,
    htmlContents,
  };
};

const createPartialHtmlContents = async <
  PartialT extends { mdContents?: Record<ILang, string> }
>(
  PartialDataTypeIn: PartialT,
  ctx: z.RefinementCtx<PartialT>
): Promise<
  | PartialT
  | (PartialT & {
      mdContents: Record<ILang, string>;
      htmlContents: Record<ILang, IContent<unknown>>;
    })
> => {
  if (!PartialDataTypeIn.mdContents) {
    return PartialDataTypeIn;
  }
  type T = PartialT & {
    mdContents: Record<ILang, string>;
  };
  return createHtmlContents(PartialDataTypeIn as T, ctx as z.RefinementCtx<T>);
};

export { createHtmlContents, createPartialHtmlContents };
