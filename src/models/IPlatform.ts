import { z } from "zod/v4";

const platforms = {
  WINDOWS: "Windows",
  MACOS: "macOS",
  LINUX: "Linux",
  ANDROID: "Android",
  IOS: "iOS",
  WEB: "Web",
} as const;
const ZEPlatforms = z.enum(platforms);
type IPlatform = z.infer<typeof ZEPlatforms>;

export type { IPlatform };
export { ZEPlatforms };
