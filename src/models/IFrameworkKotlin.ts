import { z } from "zod/v4";
import ICheckOut from "./ICheckOut";

const ZEFrameworksKotlinIn = z.enum(["JETPACK_COMPOSE"]);

type IFrameworkKotlinIn = z.infer<typeof ZEFrameworksKotlinIn>;

const frameworksKotlinMapping = {
  JETPACK_COMPOSE: {
    name: "Jetpack Compose",
    iconName: "SiJetpackcompose",
    color: "#4285F4",
  },
} as const satisfies Record<IFrameworkKotlinIn, ICheckOut>;

type IFrameworksKotlinMapping = typeof frameworksKotlinMapping;

type IFrameworkKotlinOut = IFrameworksKotlinMapping[IFrameworkKotlinIn];

export type {
  IFrameworkKotlinIn,
  IFrameworksKotlinMapping,
  IFrameworkKotlinOut,
};
export { ZEFrameworksKotlinIn, frameworksKotlinMapping };
