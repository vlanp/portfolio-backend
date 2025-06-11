import { z } from "zod/v4";
const ZEPlatformsIn = z.enum([
    "WINDOWS",
    "MACOS",
    "LINUX",
    "ANDROID",
    "IOS",
    "WEB",
]);
const platformsMapping = {
    WINDOWS: {
        name: "Windows",
        iconName: "FaWindows",
        color: "#000000",
    },
    MACOS: {
        name: "macOS",
        iconName: "SiMacos",
        color: "#000000",
    },
    LINUX: {
        name: "Linux",
        iconName: "SiLinux",
        color: "#FCC624",
    },
    ANDROID: {
        name: "Android",
        iconName: "SiAndroid",
        color: "#3DDC84",
    },
    IOS: {
        name: "iOS",
        iconName: "SiIos",
        color: "#000000",
    },
    WEB: {
        name: "Web",
        iconName: "SiMdnwebdocs",
        color: "#000000",
    },
};
const platformsReverseMapping = Object.fromEntries(Object.entries(platformsMapping).map(([key, value]) => [value.name, key]));
export { ZEPlatformsIn, platformsMapping, platformsReverseMapping };
