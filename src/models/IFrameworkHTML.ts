import { z } from "zod/v4";
import ICheckOutFramework from "./ICheckOutFramework";

const ZEFrameworksHTMLIn = z.enum([]);

type IFrameworkHTMLIn = z.infer<typeof ZEFrameworksHTMLIn>;

const frameworksHTMLMapping = {} as const satisfies Record<
  IFrameworkHTMLIn,
  ICheckOutFramework
>;

type IFrameworksHTMLMapping = typeof frameworksHTMLMapping;

type IFrameworHTMLOut = IFrameworksHTMLMapping[IFrameworkHTMLIn];

export type { IFrameworHTMLOut, IFrameworkHTMLIn, IFrameworksHTMLMapping };
export { ZEFrameworksHTMLIn, frameworksHTMLMapping };
