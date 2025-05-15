import dotenv from "dotenv";
dotenv.config();
const checkEnv = () => {
    if (!process.env.MONGODB_LOCAL_URI) {
        throw new Error("MONGODB_LOCAL_URI is not defined");
    }
    if (!process.env.PORT) {
        throw new Error("PORT is not defined");
    }
    if (!process.env.ADMIN_TOKEN) {
        throw new Error("ADMIN_TOKEN is not defined");
    }
    if (!process.env.GITHUB_READ_TOKEN) {
        throw new Error("GITHUB_READ_TOKEN is not defined");
    }
    if (!process.env.BASE_GITHUB_RAW_URL) {
        throw new Error("BASE_GITHUB_RAW_URL is not defined");
    }
    return {
        MONGODB_LOCAL_URI: process.env.MONGODB_LOCAL_URI,
        PORT: process.env.PORT,
        ADMIN_TOKEN: process.env.ADMIN_TOKEN,
        GITHUB_READ_TOKEN: process.env.GITHUB_READ_TOKEN,
        BASE_GITHUB_RAW_URL: process.env.BASE_GITHUB_RAW_URL,
    };
};
const checkedEnv = checkEnv();
export default checkedEnv;
