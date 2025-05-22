import mongoose from "mongoose";
import { z } from "zod/v4";
const ZRepoDescription = z.object({
    fr: z.string(),
    en: z.string(),
});
const RepoDescriptionSchema = new mongoose.Schema({
    fr: {
        type: String,
        required: true,
    },
    en: {
        type: String,
        required: true,
    },
});
export { ZRepoDescription, RepoDescriptionSchema };
