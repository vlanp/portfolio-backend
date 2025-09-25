import mongoose from "mongoose";
import { z, ZodType } from "zod/v4";
import { ILocalized } from "./ILocalized";

const ZRepoDescription = z.strictObject({
  fr: z.string(),
  en: z.string(),
}) satisfies ZodType<ILocalized>;

type IRepoDescription = z.infer<typeof ZRepoDescription>;

const RepoDescriptionSchema = new mongoose.Schema<IRepoDescription>(
  {
    fr: {
      type: String,
      required: true,
    },
    en: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

export { ZRepoDescription, RepoDescriptionSchema };
export type { IRepoDescription };
