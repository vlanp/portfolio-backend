import { z } from "zod/v4";

const ZEProgrammingLanguagesIn = z.enum([
  "JAVASCRIPT",
  "PYTHON",
  "KOTLIN",
  "CSS",
  "HTML",
]);

interface ICheckOutProgrammingLanguage {
  type: "ReactIcon";
  name: string;
  iconName: string;
  color: string;
}

type IProgrammingLanguageIn = z.infer<typeof ZEProgrammingLanguagesIn>;

const programmingLanguagesMapping = {
  JAVASCRIPT: {
    type: "ReactIcon",
    name: "JavaScript",
    iconName: "SiJavascript",
    color: "#F7DF1E",
  },
  PYTHON: {
    type: "ReactIcon",
    name: "Python",
    iconName: "SiPython",
    color: "#3776AB",
  },
  KOTLIN: {
    type: "ReactIcon",
    name: "Kotlin",
    iconName: "SiKotlin",
    color: "#7F52FF",
  },
  CSS: {
    type: "ReactIcon",
    name: "CSS",
    iconName: "SiCss3",
    color: "#256BAA",
  },
  HTML: {
    type: "ReactIcon",
    name: "HTML",
    iconName: "SiHtml5",
    color: "#E34F26",
  },
} as const satisfies Record<
  IProgrammingLanguageIn,
  ICheckOutProgrammingLanguage
>;

const programmingLanguagesReverseMapping = Object.fromEntries(
  Object.entries(programmingLanguagesMapping).map(([key, value]) => [
    value.name,
    key,
  ])
) as {
  [K in keyof typeof programmingLanguagesMapping as (typeof programmingLanguagesMapping)[K]["name"]]: K;
};

type IProgrammingLanguagesMapping = typeof programmingLanguagesMapping;

type IProgrammingLanguageOut =
  IProgrammingLanguagesMapping[IProgrammingLanguageIn];

export {
  programmingLanguagesMapping,
  ZEProgrammingLanguagesIn,
  programmingLanguagesReverseMapping,
};

export type {
  IProgrammingLanguageIn,
  IProgrammingLanguagesMapping,
  IProgrammingLanguageOut,
};
