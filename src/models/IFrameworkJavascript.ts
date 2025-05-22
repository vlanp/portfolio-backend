import z from "zod/v4";

const frameworksJavascript = {
  TYPESCRIPT: "TypeScript",
  REACT: "React",
  ANGULAR: "Angular",
  VUE_JS: "Vue.js",
  PREACT: "Preact",
  NEXT_JS: "Next.js",
  VITE: "Vite",
  REACT_NATIVE: "React Native",
  EXPO: "Expo",
  NODE_JS: "Node.js",
  EXPRESS_JS: "Express.js",
  SHADCN: "Shadcn",
  THREE_JS: "Three.js",
} as const;

const ZEFrameworksJavascript = z.enum(frameworksJavascript);
type IFrameworkJavascript = z.infer<typeof ZEFrameworksJavascript>;

export type { IFrameworkJavascript };
export { ZEFrameworksJavascript };
