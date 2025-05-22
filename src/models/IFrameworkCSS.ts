import { z } from "zod/v4";

const frameworksCSS = {
  TAILWIND_CSS: "Tailwind CSS",
} as const;

const ZEFrameworksCSS = z.enum(frameworksCSS);

type IFrameworkCSS = z.infer<typeof ZEFrameworksCSS>;

export type { IFrameworkCSS };
export { ZEFrameworksCSS };
