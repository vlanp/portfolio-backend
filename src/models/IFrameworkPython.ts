import { z } from "zod/v4";

const frameworksPython = {
  DJANGO: "Django",
  FASTAPI: "FastAPI",
} as const;
const ZEFrameworksPython = z.enum(frameworksPython);
type IFrameworkPython = z.infer<typeof ZEFrameworksPython>;

export type { IFrameworkPython };
export { ZEFrameworksPython };
