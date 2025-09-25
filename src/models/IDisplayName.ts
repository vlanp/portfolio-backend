import z from "zod/v4";
import { ZERepoTypes } from "./IRepoType.js";
import mongoose from "mongoose";

const ZDisplayName = z.strictObject({
  name: z.string(),
  type: ZERepoTypes,
});

type IDisplayName = z.infer<typeof ZDisplayName>;

type IDbDisplayName = IDisplayName;

const DisplayNameSchema = new mongoose.Schema<IDisplayName>(
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
