import mongoose from "mongoose";
const RepoSchema = new mongoose.Schema({
    displayName: {
        type: String,
        required: true,
    },
    owner: {
        type: String,
        required: true,
    },
    repo: {
        type: String,
        required: true,
    },
    path: {
        type: String,
        required: true,
    },
});
const Repo = mongoose.model("Repo", RepoSchema);
export { Repo };
