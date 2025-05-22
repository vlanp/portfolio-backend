import { z } from "zod/v4";

const frameworksKotlin = {
  JETPACK_COMPOSE: "Jetpack Compose",
} as const;
const ZEFrameworksKotlin = z.enum(frameworksKotlin);
type IFrameworkKotlin = z.infer<typeof ZEFrameworksKotlin>;

export type { IFrameworkKotlin };
export { ZEFrameworksKotlin };
