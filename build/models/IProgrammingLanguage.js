import { z } from "zod/v4";
const ZEProgrammingLanguagesIn = z.enum([
    "TYPESCRIPT",
    "JAVASCRIPT",
    "PYTHON",
    "KOTLIN",
]);
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
};
export { programmingLanguagesMapping, ZEProgrammingLanguagesIn };
