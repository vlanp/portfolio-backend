import { z } from "zod/v4";

const ZEProgrammingLanguagesIn = z.enum([
  "JAVASCRIPT",
  "PYTHON",
  "KOTLIN",
  "CSS",
  "HTML",
]);

interface ICheckOutProgrammingLanguage {
  name: string;
  iconName: string;
  color: string;
}

type IProgrammingLanguageIn = z.infer<typeof ZEProgrammingLanguagesIn>;

const programmingLanguagesMapping = {
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
  CSS: {
    name: "CSS",
    iconName: "SiCss3",
    color: "#256BAA",
  },
  HTML: {
    name: "HTML",
    iconName: "SiHtml5",
    color: "#E34F26",
  },
} as const satisfies Record<
  IProgrammingLanguageIn,
  ICheckOutProgrammingLanguage
>;

type IProgrammingLanguagesMapping = typeof programmingLanguagesMapping;

type IProgrammingLanguageOut =
  IProgrammingLanguagesMapping[IProgrammingLanguageIn];

export { programmingLanguagesMapping, ZEProgrammingLanguagesIn };

export type {
  IProgrammingLanguageIn,
  IProgrammingLanguagesMapping,
  IProgrammingLanguageOut,
};
