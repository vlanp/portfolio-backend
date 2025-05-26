import { z } from "zod/v4";
import ICheckOut from "./ICheckOut";

const ZEProgrammingLanguagesIn = z.enum([
  "TYPESCRIPT",
  "JAVASCRIPT",
  "PYTHON",
  "KOTLIN",
]);

type IProgrammingLanguageIn = z.infer<typeof ZEProgrammingLanguagesIn>;

const programmingLanguagesMapping = {
  TYPESCRIPT: {
    name: "TypeScript",
    iconName: "SiTypescript",
    color: "#3178C6",
  },
  JAVASCRIPT: {
    name: "JavaScript",
    iconName: "SiJavascript",
    color: "#F7DF1E",
  },
  PYTHON: {
    name: "Python",
    iconName: "SiPython",
    color: "#3776AB",
  },
  KOTLIN: {
    name: "Kotlin",
    iconName: "SiKotlin",
    color: "#7F52FF",
  },
} as const satisfies Record<IProgrammingLanguageIn, ICheckOut>;

type IProgrammingLanguagesMapping = typeof programmingLanguagesMapping;

type IProgrammingLanguageOut =
  IProgrammingLanguagesMapping[IProgrammingLanguageIn];

export { programmingLanguagesMapping, ZEProgrammingLanguagesIn };

export type {
  IProgrammingLanguageIn,
  IProgrammingLanguagesMapping,
  IProgrammingLanguageOut,
};
