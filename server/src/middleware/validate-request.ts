import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

type RequestPart = "body" | "params" | "query";

export function validateRequest(part: RequestPart, schema: ZodSchema) {
  return (request: Request, _response: Response, next: NextFunction) => {
    request[part] = schema.parse(request[part]);
    next();
  };
}
