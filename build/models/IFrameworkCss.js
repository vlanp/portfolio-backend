import { z } from "zod/v4";
const frameworksCSS = {
    TAILWIND_CSS: "Tailwind CSS",
};
const ZEFrameworksCSS = z.enum(frameworksCSS);
export { ZEFrameworksCSS };
