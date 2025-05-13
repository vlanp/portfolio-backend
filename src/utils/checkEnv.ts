import dotenv from "dotenv";
dotenv.config();

interface EnvVariables {
  MONGODB_LOCAL_URI: string;
  PORT: string;
  ADMIN_TOKEN: string;
  GITHUB_READ_TOKEN: string;
}

const checkEnv = (): EnvVariables => {
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
  return {
    MONGODB_LOCAL_URI: process.env.MONGODB_LOCAL_URI,
    PORT: process.env.PORT,
    ADMIN_TOKEN: process.env.ADMIN_TOKEN,
    GITHUB_READ_TOKEN: process.env.GITHUB_READ_TOKEN,
  };
};

const checkedEnv = checkEnv();

export default checkedEnv;
