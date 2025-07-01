import { NextFunction, Request } from "express";
import checkedEnv from "../utils/checkEnv.js";
import { IUnauthorizedResponse } from "../models/ITypedResponse.js";

const isAdmin = (
  req: Request,
  res: IUnauthorizedResponse,
  next: NextFunction
) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token !== checkedEnv.ADMIN_TOKEN) {
    res.responsesFunc.sendUnauthorizedResponse("No admin token found");
    return;
  }
  next();
};

export default isAdmin;
