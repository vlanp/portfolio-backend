import z from "zod/v4";
import ICheckOutFramework from "./ICheckOutFramework";

const ZEFrameworksJavascriptIn = z.enum([
  "ANGULAR",
  "AXIOS",
  "CLOUDINARY",
  "EXPO",
  "EXPRESS_JS",
  "FONT_AWESOME",
  "MONGOOSE",
  "NEXT_JS",
  "NODE_JS",
  "NODEMON",
  "PREACT",
  "REACT",
  "REACT_NATIVE",
  "REACT_ROUTER",
  "SHADCN",
  "STRIPE",
  "THREE_JS",
  "TYPESCRIPT",
  "VITE",
  "VUE_JS",
  "ZUSTAND",
  "NODEMAILER",
]);

type IFrameworkJavascriptIn = z.infer<typeof ZEFrameworksJavascriptIn>;

const frameworksJavascriptMapping = {
  TYPESCRIPT: {
    type: "ReactIcon",
    name: "TypeScript",
    iconName: "SiTypescript",
    color: "#3178C6",
  },
  REACT: {
    type: "ReactIcon",
    name: "React",
    iconName: "SiReact",
    color: "#61DAFB",
  },
  ANGULAR: {
    type: "ReactIcon",
    name: "Angular",
    iconName: "SiAngular",
    color: "#0F0F11",
  },
  VUE_JS: {
    type: "ReactIcon",
    name: "Vue.js",
    iconName: "SiVuedotjs",
    color: "#4FC08D",
  },
  PREACT: {
    type: "ReactIcon",
    name: "Preact",
    iconName: "SiPreact",
    color: "#673AB8",
  },
  NEXT_JS: {
    type: "ReactIcon",
    name: "Next.js",
    iconName: "SiNextdotjs",
    color: "#000000",
  },
  VITE: {
    type: "ReactIcon",
    name: "Vite",
    iconName: "SiVite",
    color: "#646CFF",
  },
  REACT_NATIVE: {
    type: "ReactIcon",
    name: "React Native",
    iconName: "SiReact",
    color: "#61DAFB",
  },
  EXPO: {
    type: "ReactIcon",
    name: "Expo",
    iconName: "SiExpo",
    color: "#1C2024",
  },
  NODE_JS: {
    type: "ReactIcon",
    name: "Node.js",
    iconName: "SiNodedotjs",
    color: "#5FA04E",
  },
  NODEMON: {
    type: "ReactIcon",
    name: "Nodemon",
    iconName: "SiNodemon",
    color: "#76D04B",
  },
  EXPRESS_JS: {
    type: "ReactIcon",
    name: "Express.js",
    iconName: "SiExpress",
    color: "#000000",
  },
  SHADCN: {
    type: "ReactIcon",
    name: "Shadcn",
    iconName: "SiShadcnui",
    color: "#000000",
  },
  THREE_JS: {
    type: "ReactIcon",
    name: "Three.js",
    iconName: "SiThreedotjs",
    color: "#000000",
  },
  AXIOS: {
    type: "ReactIcon",
    name: "Axios",
    iconName: "SiAxios",
    color: "#5A29E4",
  },
  CLOUDINARY: {
    type: "ReactIcon",
    name: "Cloudinary",
    iconName: "SiCloudinary",
    color: "#3448C5",
  },
  FONT_AWESOME: {
    type: "ReactIcon",
    name: "Font Awesome",
    iconName: "SiFontawesome",
    color: "#538DD7",
  },
  MONGOOSE: {
    type: "ReactIcon",
    name: "Mongoose",
    iconName: "SiMongoose",
    color: "#880000",
  },
  REACT_ROUTER: {
    type: "ReactIcon",
    name: "React Router",
    iconName: "SiReactrouter",
    color: "#CA4245",
  },
  STRIPE: {
    type: "ReactIcon",
    name: "Stripe",
    iconName: "SiStripe",
    color: "#635BFF",
  },
  ZUSTAND: {
    type: "CustomIcon",
    name: "Zustand",
    imgLink:
      "https://res.cloudinary.com/dwuvdquym/image/upload/v1754593043/portolio/frameworks/Zustand_2_epbxz2.svg",
    widthPx: 512,
    heightPx: 512,
  },
  NODEMAILER: {
    type: "CustomIcon",
    name: "Nodemailer",
    imgLink:
      "https://res.cloudinary.com/dwuvdquym/image/upload/v1754593360/portolio/frameworks/Nodemailer_mxqm4u.png",
    widthPx: 640,
    heightPx: 320,
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
