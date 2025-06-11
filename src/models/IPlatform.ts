import { z } from "zod/v4";

interface ICheckOutPlatform {
  name: string;
  iconName: string;
  color: string;
}

const ZEPlatformsIn = z.enum([
  "WINDOWS",
  "MACOS",
  "LINUX",
  "ANDROID",
  "IOS",
  "WEB",
]);

type IPlatformIn = z.infer<typeof ZEPlatformsIn>;

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
} as const satisfies Record<IPlatformIn, ICheckOutPlatform>;

const platformsReverseMapping = Object.fromEntries(
  Object.entries(platformsMapping).map(([key, value]) => [value.name, key])
) as {
  [K in keyof typeof platformsMapping as (typeof platformsMapping)[K]["name"]]: K;
};

type IPlatformsMapping = typeof platformsMapping;

type IPlaformOut = IPlatformsMapping[IPlatformIn];

export type { IPlatformIn, IPlatformsMapping, IPlaformOut };
export { ZEPlatformsIn, platformsMapping, platformsReverseMapping };
