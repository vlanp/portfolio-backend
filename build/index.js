import express from "express";
import mongoose from "mongoose";
import checkedEnv from "./utils/checkEnv.js";
import projectRouter from "./routes/project.js";
// import testRouter from "./routes/someTest.js";
import cors from "cors";
import { addTypedResponses, } from "./models/ITypedResponse.js";
mongoose.connect(checkedEnv.MONGODB_URI);
const app = express();
app.use(addTypedResponses);
app.use(cors());
app.use(express.json());
app.use(projectRouter);
// app.use(testRouter);
app.all("/*all", (req, res) => {
    res.status(404).json({
        message: "This route does not exist",
    });
});
function errorHandler(err, req, res, next) {
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
