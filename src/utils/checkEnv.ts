import dotenv from "dotenv";
dotenv.config();

interface EnvVariables {
  MONGODB_URI: string;
  PORT: string;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
  ADMIN_TOKEN: string;
  GITHUB_READ_TOKEN: string;
  BASE_GITHUB_RAW_URL: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
}

const checkEnv = (): EnvVariables => {
  if (!process.env.MONGODB_LOCAL_URI) {
    throw new Error("MONGODB_LOCAL_URI is not defined");
  }
  if (!process.env.MONGODB_REMOTE_URI) {
    throw new Error("MONGODB_REMOTE_URI is not defined");
  }
  if (!process.env.PORT) {
    throw new Error("PORT is not defined");
  }
  if (!process.env.ADMIN_EMAIL) {
    throw new Error("ADMIN_EMAIL is not defined");
  }
  if (!process.env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD is not defined");
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
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error("CLOUDINARY_CLOUD_NAME is not defined");
  }
  if (!process.env.CLOUDINARY_API_KEY) {
    throw new Error("CLOUDINARY_API_KEY is not defined");
  }
  if (!process.env.CLOUDINARY_API_SECRET) {
    throw new Error("CLOUDINARY_API_SECRET is not defined");
  }
  return {
    MONGODB_URI: process.env.MONGODB_REMOTE_URI, // Either use local or remote URI
    PORT: process.env.PORT,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_TOKEN: process.env.ADMIN_TOKEN,
    GITHUB_READ_TOKEN: process.env.GITHUB_READ_TOKEN,
    BASE_GITHUB_RAW_URL: process.env.BASE_GITHUB_RAW_URL,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  };
};

const checkedEnv = checkEnv();

export default checkedEnv;
