import { z } from "zod/v4";
const frameworksPython = {
    DJANGO: "Django",
    FASTAPI: "FastAPI",
};
const ZEFrameworksPython = z.enum(frameworksPython);
export { ZEFrameworksPython };
