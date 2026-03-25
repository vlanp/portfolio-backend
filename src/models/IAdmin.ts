import { z } from "zod/v4";

const ZAdminIn = z.strictObject({
  email: z.email(),
  password: z.string(),
});

type IAdminIn = z.infer<typeof ZAdminIn>;

const ZAdminOut = z.strictObject({
  email: z.email(),
  token: z.uuidv4(),
});

type IAdminOut = z.infer<typeof ZAdminOut>;

export { ZAdminIn, ZAdminOut };
export type { IAdminIn, IAdminOut };
