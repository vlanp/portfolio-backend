import mongoose, { Types, } from "mongoose";
import { RepoSchema, ZDbRepo, ZRepoIn, ZRepoOut } from "./IRepo.js";
import z from "zod/v4";
const ZProjectIn = z.object({
    name: z.string(),
    repos: z.array(ZRepoIn),
    isFullStack: z.boolean(),
});
const ZDbProject = ZProjectIn.extend({
    _id: z.instanceof(Types.ObjectId),
    createdAt: z.instanceof(Date),
    updatedAt: z.instanceof(Date),
    __v: z.number(),
    repos: z.array(ZDbRepo),
});
const ZProjectOut = ZDbProject.extend({
    repos: z.array(ZRepoOut),
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
