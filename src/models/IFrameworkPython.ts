import { z } from "zod/v4";
import ICheckOutFramework from "./ICheckOutFramework";

const ZEFrameworksPythonIn = z.enum(["DJANGO", "FASTAPI"]);

type IFrameworkPythonIn = z.infer<typeof ZEFrameworksPythonIn>;

const frameworksPythonMapping = {
  DJANGO: {
    type: "ReactIcon",
    name: "Django",
    iconName: "SiDjango",
    color: "#092E20",
  },
  FASTAPI: {
    type: "ReactIcon",
    name: "FastAPI",
    iconName: "SiFastapi",
    color: "#009688",
  },
} as const satisfies Record<IFrameworkPythonIn, ICheckOutFramework>;

type IFrameworksPythonMapping = typeof frameworksPythonMapping;

type IFrameworkPythonOut = IFrameworksPythonMapping[IFrameworkPythonIn];

export type {
  IFrameworkPythonIn,
  IFrameworksPythonMapping,
  IFrameworkPythonOut,
};
export { ZEFrameworksPythonIn, frameworksPythonMapping };
