import { NextFunction, Request, Response } from "express";
import checkedEnv from "../utils/checkEnv.js";

const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token !== checkedEnv.ADMIN_TOKEN) {
    res.status(401).json({ message: "No admin token found" });
    return;
  }
  next();
};

export default isAdmin;
