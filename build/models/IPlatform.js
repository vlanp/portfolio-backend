import { z } from "zod/v4";
const platforms = {
    WINDOWS: "Windows",
    MACOS: "macOS",
    LINUX: "Linux",
    ANDROID: "Android",
    IOS: "iOS",
    WEB: "Web",
};
const ZEPlatforms = z.enum(platforms);
export { ZEPlatforms };
