import express from "express";
import mongoose from "mongoose";
import checkedEnv from "./utils/checkEnv.js";
import repoRouter from "./routes/repo.js";
import cors from "cors";

mongoose.connect(checkedEnv.MONGODB_LOCAL_URI);

const app = express();

app.use(cors());

app.use(express.json());

app.use(repoRouter);

app.all("/*all", (req, res) => {
  res.status(404).json({
    message: "This route does not exist",
  });
});

app.listen(checkedEnv.PORT, () => {
  console.log(`Server is running on port ${checkedEnv.PORT}`);
});
