import z from "zod/v4";
import { ZERepoTypes } from "./IRepoType.js";
import mongoose from "mongoose";
const ZDisplayName = z.object({
    name: z.string(),
    type: ZERepoTypes,
});
class DisplayName {
    constructor(name, type) {
        this.toString = () => this.name + " " + this.type;
        this.name = name;
        this.type = type;
    }
}
const DisplayNameSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: Object.values(ZERepoTypes.enum),
        required: true,
    },
}, { _id: false });
export { DisplayName, ZDisplayName, DisplayNameSchema };
