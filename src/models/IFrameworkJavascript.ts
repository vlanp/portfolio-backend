import z from "zod/v4";
import ICheckOutFramework from "./ICheckOutFramework";

const ZEFrameworksJavascriptIn = z.enum([
  "TYPESCRIPT",
  "REACT",
  "ANGULAR",
  "VUE_JS",
  "PREACT",
  "NEXT_JS",
  "VITE",
  "REACT_NATIVE",
  "EXPO",
  "NODE_JS",
  "NODEMON",
  "EXPRESS_JS",
  "SHADCN",
  "THREE_JS",
]);

type IFrameworkJavascriptIn = z.infer<typeof ZEFrameworksJavascriptIn>;

const frameworksJavascriptMapping = {
  TYPESCRIPT: {
    name: "TypeScript",
    iconName: "SiTypescript",
    color: "#3178C6",
  },
  REACT: {
    name: "React",
    iconName: "SiReact",
    color: "#61DAFB",
  },
  ANGULAR: {
    name: "Angular",
    iconName: "SiAngular",
    color: "#0F0F11",
  },
  VUE_JS: {
    name: "Vue.js",
    iconName: "SiVuedotjs",
    color: "#4FC08D",
  },
  PREACT: {
    name: "Preact",
    iconName: "SiPreact",
    color: "#673AB8",
  },
  NEXT_JS: {
    name: "Next.js",
    iconName: "SiNextdotjs",
    color: "#000000",
  },
  VITE: {
    name: "Vite",
    iconName: "SiVite",
    color: "#646CFF",
  },
  REACT_NATIVE: {
    name: "React Native",
    iconName: "SiReact",
    color: "#61DAFB",
  },
  EXPO: {
    name: "Expo",
    iconName: "SiExpo",
    color: "#1C2024",
  },
  NODE_JS: {
    name: "Node.js",
    iconName: "SiNodedotjs",
    color: "#5FA04E",
  },
  NODEMON: {
    name: "Nodemon",
    iconName: "SiNodemon",
    color: "#76D04B",
  },
  EXPRESS_JS: {
    name: "Express.js",
    iconName: "SiExpress",
    color: "#000000",
  },
  SHADCN: {
    name: "Shadcn",
    iconName: "SiShadcnui",
    color: "#000000",
  },
  THREE_JS: {
    name: "Three.js",
    iconName: "SiThreedotjs",
    color: "#000000",
  },
} as const satisfies Record<IFrameworkJavascriptIn, ICheckOutFramework>;

type IFrameworksJavascriptMapping = typeof frameworksJavascriptMapping;

type IFrameworkJavascriptOut =
  IFrameworksJavascriptMapping[IFrameworkJavascriptIn];

export type {
  IFrameworkJavascriptIn,
  IFrameworkJavascriptOut,
  IFrameworksJavascriptMapping,
};
export { ZEFrameworksJavascriptIn, frameworksJavascriptMapping };
