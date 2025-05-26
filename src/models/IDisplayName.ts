import z from "zod/v4";
import { IRepoType, ZERepoTypes } from "./IRepoType.js";
import mongoose from "mongoose";

const ZDisplayName = z.object({
  name: z.string(),
  type: ZERepoTypes,
});

type IDisplayName = z.infer<typeof ZDisplayName>;

class DisplayName implements IDisplayName {
  name: string;
  type: IRepoType;
  toString: () => string = () => this.name + " " + this.type;
  constructor(name: string, type: IRepoType) {
    this.name = name;
    this.type = type;
  }
}

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

export { DisplayName, ZDisplayName, DisplayNameSchema };
export type { IDisplayName };
