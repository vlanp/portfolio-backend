import mongoose from "mongoose";
import { RepoSchema, ZRepoIn, ZRepoOut } from "./IRepo.js";
import z from "zod/v4";
const ZProjectIn = z.object({
    name: z.string(),
    repos: z.array(ZRepoIn),
    isFullStack: z.boolean(),
});
const ZProjectOut = z.object({
    name: z.string(),
    repos: z.array(ZRepoOut),
    isFullStack: z.boolean(),
});
const ProjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    repos: {
        type: [RepoSchema],
        required: true,
    },
    isFullStack: {
        type: Boolean,
        required: true,
    },
}, {
    timestamps: true,
    _id: true,
});
const Project = mongoose.model("Project", ProjectSchema);
export { Project, ProjectSchema, ZProjectIn, ZProjectOut };
