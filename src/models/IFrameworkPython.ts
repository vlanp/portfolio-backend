import { z } from "zod/v4";
import ICheckOut from "./ICheckOut";

const ZEFrameworksPythonIn = z.enum(["DJANGO", "FASTAPI"]);

type IFrameworkPythonIn = z.infer<typeof ZEFrameworksPythonIn>;

const frameworksPythonMapping = {
  DJANGO: {
    name: "Django",
    iconName: "SiDjango",
    color: "#092E20",
  },
  FASTAPI: {
    name: "FastAPI",
    iconName: "SiFastapi",
    color: "#009688",
  },
} as const satisfies Record<IFrameworkPythonIn, ICheckOut>;

type IFrameworksPythonMapping = typeof frameworksPythonMapping;

type IFrameworkPythonOut = IFrameworksPythonMapping[IFrameworkPythonIn];

export type {
  IFrameworkPythonIn,
  IFrameworksPythonMapping,
  IFrameworkPythonOut,
};
export { ZEFrameworksPythonIn, frameworksPythonMapping };
