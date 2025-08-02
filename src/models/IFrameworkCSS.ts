import { z } from "zod/v4";
import ICheckOutFramework from "./ICheckOutFramework";

const ZEFrameworksCSSIn = z.enum(["TAILWIND_CSS", "SASS"]);

type IFrameworkCSSIn = z.infer<typeof ZEFrameworksCSSIn>;

const frameworksCSSMapping = {
  TAILWIND_CSS: {
    name: "Tailwind CSS",
    iconName: "SiTailwindcss",
    color: "#06B6D4",
  },
  SASS: {
    name: "Sass",
    iconName: "SiSass",
    color: "#CC6699",
  },
} as const satisfies Record<IFrameworkCSSIn, ICheckOutFramework>;

type IFrameworksCSSMapping = typeof frameworksCSSMapping;

type IFrameworkCSSOut = IFrameworksCSSMapping[IFrameworkCSSIn];

export type { IFrameworkCSSIn, IFrameworksCSSMapping, IFrameworkCSSOut };
export { frameworksCSSMapping, ZEFrameworksCSSIn };
