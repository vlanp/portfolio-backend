"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Repo = void 0;
var mongoose_1 = __importDefault(require("mongoose"));
var RepoSchema = new mongoose_1.default.Schema({
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
var Repo = mongoose_1.default.model("Repo", RepoSchema);
exports.Repo = Repo;
