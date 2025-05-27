import z from "zod/v4";
import { IRepoType, ZERepoTypes } from "./IRepoType.js";
import mongoose from "mongoose";

const ZDisplayName = z.object({
  name: z.string(),
  type: ZERepoTypes,
});

type IDisplayName = z.infer<typeof ZDisplayName>;

interface IDbDisplayName extends IDisplayName {}

const DisplayNameSchema = new mongoose.Schema<IDbDisplayName>(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ZERepoTypes.options,
      required: true,
    },
  },
  { _id: false }
);

export { ZDisplayName, DisplayNameSchema };
export type { IDisplayName, IDbDisplayName };
