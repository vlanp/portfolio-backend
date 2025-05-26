import { z } from "zod/v4";
const ZEFrameworksPythonIn = z.enum(["DJANGO", "FASTAPI"]);
const frameworksPythonMapping = {
    DJANGO: {
        name: "Django",
        iconName: "SiDjango",
        color: "#092E20",
    },
    FASTAPI: {
        name: "FastAPI",
        iconName: "SiFastapi",
        color: "#009688",
    },
};
export { ZEFrameworksPythonIn, frameworksPythonMapping };
