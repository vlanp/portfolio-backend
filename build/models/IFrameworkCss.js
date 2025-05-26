import { z } from "zod/v4";
const ZEFrameworksCSSIn = z.enum(["TAILWIND_CSS"]);
const frameworksCSSMapping = {
    TAILWIND_CSS: {
        name: "Tailwind CSS",
        iconName: "SiTailwindcss",
        color: "#06B6D4",
    },
};
export { frameworksCSSMapping, ZEFrameworksCSSIn };
