import { z } from "zod/v4";
const programmingLanguages = {
    JAVASCRIPT: "JavaScript",
    PYTHON: "Python",
    KOTLIN: "Kotlin",
};
const ZEProgrammingLanguages = z.enum(programmingLanguages);
export { ZEProgrammingLanguages };
