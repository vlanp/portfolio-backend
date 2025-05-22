import z from "zod/v4";

const repoTypes = {
  FRONTEND: "Front-End",
  BACKEND: "Back-End",
} as const;

const ZERepoTypes = z.enum(repoTypes);

type IRepoType = z.infer<typeof ZERepoTypes>;

export type { IRepoType };
export { ZERepoTypes };
