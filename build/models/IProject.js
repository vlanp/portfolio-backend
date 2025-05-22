import mongoose from "mongoose";
import { RepoSchema, ZRepo } from "./IRepo.js";
import z from "zod/v4";
const ZProject = z.object({
    name: z.string(),
    repos: z.array(ZRepo),
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
});
const Project = mongoose.model("Project", ProjectSchema);
export { Project, ProjectSchema, ZProject };
