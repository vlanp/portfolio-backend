import z from "zod/v4";
import { ZERepoTypes } from "./IRepoType.js";
import mongoose from "mongoose";
const ZDisplayName = z.object({
    name: z.string(),
    type: ZERepoTypes,
});
const DisplayNameSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ZERepoTypes.options,
        required: true,
    },
}, { _id: false });
export { ZDisplayName, DisplayNameSchema };
