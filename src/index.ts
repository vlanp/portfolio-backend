import express, { NextFunction, Request } from "express";
import mongoose from "mongoose";
import checkedEnv from "./utils/checkEnv.js";
import projectRouter from "./routes/project.js";
import pictureRouter from "./routes/picture.js";
// import testRouter from "./routes/someTest.js";
import cors from "cors";
import {
  addTypedResponses,
  IInternalServerErrorResponse,
} from "./models/ITypedResponse.js";
import { v2 as cloudinary } from "cloudinary";

mongoose.connect(checkedEnv.MONGODB_URI);

const app = express();

cloudinary.config({
  cloud_name: checkedEnv.CLOUDINARY_CLOUD_NAME,
  api_key: checkedEnv.CLOUDINARY_API_KEY,
  api_secret: checkedEnv.CLOUDINARY_API_SECRET,
});

app.use(addTypedResponses);

app.use(cors());

app.use(express.json());

app.use(projectRouter);

app.use(pictureRouter);

// app.use(testRouter);

app.all("/*all", (req, res) => {
  res.status(404).json({
    message: "This route does not exist",
  });
});

function errorHandler(
  err: Error,
  req: Request,
  res: IInternalServerErrorResponse,
  next: NextFunction
) {
  if (res.headersSent) {
    return next(err);
  }
  console.log(err);
  res.responsesFunc.sendInternalServerErrorResponse();
}

app.use(errorHandler);

app.listen(checkedEnv.PORT, () => {
  console.log(`Server is running on port ${checkedEnv.PORT}`);
});
