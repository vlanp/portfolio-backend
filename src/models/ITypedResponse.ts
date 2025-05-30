import { IResponsesFunctions, Send } from "express-serve-static-core";
// eslint-disable-next-line no-restricted-imports
import { NextFunction, Response, Request } from "express";

type IStatusCode =
  | 200
  | 201
  | 202
  | 204
  | 400
  | 401
  | 403
  | 404
  | 409
  | 422
  | 500;

type IApiSuccessResponse<ResponseType> = {
  success: true;
  message: string;
  data: ResponseType;
};

type IApiErrorResponse = {
  success: false;
  message: string;
};

type IResponseForStatus<
  StatusCode extends number,
  ResponseType
> = StatusCode extends 500
  ? IApiErrorResponse
  : StatusCode extends 400 | 401 | 403 | 404 | 409 | 422 | 501 | 502 | 503
  ? IApiErrorResponse
  : IApiSuccessResponse<ResponseType>;

interface ITypedResponse<
  StatusCode extends IStatusCode,
  ResponseType = undefined
> extends Response {
  status(code: StatusCode): this;
  json: Send<IResponseForStatus<StatusCode, ResponseType>, this>;
}

export interface IOkResponse<ResponseType>
  extends Omit<ITypedResponse<200, ResponseType>, "responsesFunc"> {
  responsesFunc: Pick<IResponsesFunctions<ResponseType>, "sendOkResponse">;
}

export interface ICreatedResponse<ResponseType>
  extends Omit<ITypedResponse<201, ResponseType>, "responsesFunc"> {
  responsesFunc: Pick<IResponsesFunctions<ResponseType>, "sendCreatedResponse">;
}

export interface IAcceptedReponse<ResponseType>
  extends Omit<ITypedResponse<202, ResponseType>, "responsesFunc"> {
  responsesFunc: Pick<
    IResponsesFunctions<ResponseType>,
    "sendAcceptedResponse"
  >;
}

export interface INoContentResponse
  extends Omit<ITypedResponse<204>, "responsesFunc"> {
  responsesFunc: Pick<IResponsesFunctions, "sendNoContentResponse">;
}

export interface IBadRequestResponse
  extends Omit<ITypedResponse<400>, "responsesFunc"> {
  responsesFunc: Pick<IResponsesFunctions, "sendBadRequestResponse">;
}

export interface IUnauthorizedResponse
  extends Omit<ITypedResponse<401>, "responsesFunc"> {
  responsesFunc: Pick<IResponsesFunctions, "sendUnauthorizedResponse">;
}

export interface IForbiddenResponse
  extends Omit<ITypedResponse<403>, "responsesFunc"> {
  responsesFunc: Pick<IResponsesFunctions, "sendForbiddenResponse">;
}

export interface INotFoundResponse
  extends Omit<ITypedResponse<404>, "responsesFunc"> {
  responsesFunc: Pick<IResponsesFunctions, "sendNotFoundResponse">;
}

export interface IConflictResponse
  extends Omit<ITypedResponse<409>, "responsesFunc"> {
  responsesFunc: Pick<IResponsesFunctions, "sendConflictResponse">;
}

export interface IUnprocessableEntityResponse
  extends Omit<ITypedResponse<422>, "responsesFunc"> {
  responsesFunc: Pick<IResponsesFunctions, "sendUnprocessableEntityResponse">;
}

export interface IInternalServerErrorResponse
  extends Omit<ITypedResponse<500>, "responsesFunc"> {
  responsesFunc: Pick<IResponsesFunctions, "sendInternalServerErrorResponse">;
}

export const addTypedResponses = (
  req: Request,
  expressResponse: Response,
  next: NextFunction
) => {
  const okResponse = expressResponse as IOkResponse<unknown>;
  const createdResponse = expressResponse as ICreatedResponse<unknown>;
  const acceptedResponse = expressResponse as IAcceptedReponse<unknown>;
  const noContentResponse = expressResponse as INoContentResponse;
  const badRequestResponse = expressResponse as IBadRequestResponse;
  const unauthorizedResponse = expressResponse as IUnauthorizedResponse;
  const forbiddenResponse = expressResponse as IForbiddenResponse;
  const notFoundResponse = expressResponse as INotFoundResponse;
  const conflictResponse = expressResponse as IConflictResponse;
  const UnprocessableEntityResponse =
    expressResponse as IUnprocessableEntityResponse;
  const internalServerErrorResponse =
    expressResponse as IInternalServerErrorResponse;

  expressResponse.responsesFunc = {
    sendOkResponse: <ResponseType>(data: ResponseType, message?: string) => {
      okResponse.status(200).json({
        success: true,
        message: message || "Success",
        data,
      });
    },

    sendCreatedResponse: <ResponseType>(
      data: ResponseType,
      message?: string
    ) => {
      createdResponse.status(201).json({
        success: true,
        message: message || "Created",
        data,
      });
    },

    sendAcceptedResponse: <ResponseType>(
      data: ResponseType,
      message?: string
    ) => {
      acceptedResponse.status(202).json({
        success: true,
        message: message || "Accepted",
        data,
      });
    },

    sendNoContentResponse: () => {
      noContentResponse.status(204).send();
    },

    sendBadRequestResponse: (message?: string) => {
      badRequestResponse.status(400).json({
        success: false,
        message: message || "Bad Request",
      });
    },

    sendUnauthorizedResponse: (message?: string) => {
      unauthorizedResponse.status(401).json({
        success: false,
        message: message || "Unauthorized",
      });
    },

    sendForbiddenResponse: (message?: string) => {
      forbiddenResponse.status(403).json({
        success: false,
        message: message || "Forbidden",
      });
    },

    sendNotFoundResponse: (message?: string) => {
      notFoundResponse.status(404).json({
        success: false,
        message: message || "Not Found",
      });
    },

    sendConflictResponse: (message?: string) => {
      conflictResponse.status(409).json({
        success: false,
        message: message || "Conflict",
      });
    },

    sendUnprocessableEntityResponse: (message?: string) => {
      UnprocessableEntityResponse.status(422).json({
        success: false,
        message: message || "Unprocessable Entity",
      });
    },

    sendInternalServerErrorResponse: (message?: string) => {
      internalServerErrorResponse.status(500).json({
        success: false,
        message: message || "Internal Server Error",
      });
    },
  };

  next();
};
