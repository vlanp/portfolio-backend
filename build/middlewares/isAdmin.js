import checkedEnv from "../utils/checkEnv.js";
const isAdmin = (req, res, next) => {
    var _a;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "");
    if (token !== checkedEnv.ADMIN_TOKEN) {
        res.status(401).json({ message: "No admin token found" });
        return;
    }
    next();
};
export default isAdmin;
