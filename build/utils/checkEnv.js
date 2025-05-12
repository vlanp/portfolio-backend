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
    return {
        MONGODB_LOCAL_URI: process.env.MONGODB_LOCAL_URI,
        PORT: process.env.PORT,
        ADMIN_TOKEN: process.env.ADMIN_TOKEN,
    };
};
const checkedEnv = checkEnv();
export default checkedEnv;
