"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var dotenv_1 = __importDefault(require("dotenv"));
var mongoose_1 = __importDefault(require("mongoose"));
dotenv_1.default.config();
if (!process.env.MONGODB_LOCAL_URI) {
    throw new Error("MONGODB_URI is not defined");
}
if (!process.env.PORT) {
    throw new Error("PORT is not defined");
}
mongoose_1.default.connect(process.env.MONGODB_LOCAL_URI);
var app = (0, express_1.default)();
app.use(express_1.default.json());
app.get("*", function (req, res) {
    res.status(404).json({
        message: "This route does not exist",
    });
});
app.listen(process.env.PORT, function () {
    console.log("Server is running on port ".concat(process.env.PORT));
});
