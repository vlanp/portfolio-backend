import mongoose from "mongoose";

interface IRepo {
  displayName: string;
  owner: string;
  repo: string;
  path: string;
}

const RepoSchema = new mongoose.Schema<IRepo>({
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

const Repo = mongoose.model<IRepo>("Repo", RepoSchema);

export type { IRepo };
export { Repo };
