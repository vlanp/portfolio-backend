import z from "zod/v4";

const ZLimit = z.coerce.number().int().positive();

type ILimit = z.infer<typeof ZLimit>;

export type { ILimit };
export { ZLimit };
