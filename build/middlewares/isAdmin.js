import checkedEnv from "../utils/checkEnv.js";
const isAdmin = (req, res, next) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token !== checkedEnv.ADMIN_TOKEN) {
        res.status(401).json({ message: "No admin token found" });
        return;
    }
    next();
};
export default isAdmin;
