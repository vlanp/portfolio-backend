import z from "zod/v4";

const ZPage = z.coerce.number().int().positive();

type IPage = z.infer<typeof ZPage>;

export type { IPage };
export { ZPage };
