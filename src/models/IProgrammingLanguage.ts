import { z } from "zod/v4";

const programmingLanguages = {
  JAVASCRIPT: "JavaScript",
  PYTHON: "Python",
  KOTLIN: "Kotlin",
} as const;
const ZEProgrammingLanguages = z.enum(programmingLanguages);
type IProgrammingLanguage = z.infer<typeof ZEProgrammingLanguages>;
export type { IProgrammingLanguage };
export { ZEProgrammingLanguages };
