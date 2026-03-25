import express, { Request } from "express";
import bcrypt from "bcrypt";
import {
  IBadRequestResponse,
  IOkResponse,
  IUnauthorizedResponse,
} from "../models/ITypedResponse.js";
import { IAdminOut, ZAdminIn } from "../models/IAdmin.js";
import z from "zod/v4";
import checkedEnv from "../utils/checkEnv.js";

const router = express.Router();

router.post(
  "/admin/signin",
  async (
    req: Request,
    res: IBadRequestResponse | IUnauthorizedResponse | IOkResponse<IAdminOut>,
  ) => {
    const adminInParseResult = ZAdminIn.safeParse(req.body);

    if (!adminInParseResult.success) {
      (res as IBadRequestResponse).responsesFunc.sendBadRequestResponse(
        z.prettifyError(adminInParseResult.error),
      );
      return;
    }

    const adminIn = adminInParseResult.data;

    const passwordMatch = await bcrypt.compare(
      adminIn.password,
      checkedEnv.ADMIN_PASSWORD,
    );

    if (adminIn.email !== checkedEnv.ADMIN_EMAIL || !passwordMatch) {
      (res as IUnauthorizedResponse).responsesFunc.sendUnauthorizedResponse(
        `Invalid email or password`,
      );
      return;
    }

    (res as IOkResponse<IAdminOut>).responsesFunc.sendOkResponse({
      email: adminIn.email,
      token: checkedEnv.ADMIN_TOKEN,
    });
  },
);

export default router;
