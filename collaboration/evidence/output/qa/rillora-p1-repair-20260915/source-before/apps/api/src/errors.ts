import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({
    error: { code: "not_found", message: "The requested resource was not found." },
  });
};

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  if (
    error &&
    typeof error === "object" &&
    "type" in error &&
    error.type === "entity.parse.failed"
  ) {
    response.status(400).json({
      error: { code: "invalid_json", message: "The request body is not valid JSON." },
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: "invalid_request",
        message: "The request did not match the API contract.",
        details: error.issues.map((issue) => ({ path: issue.path, code: issue.code })),
      },
    });
    return;
  }

  if (error instanceof ApiError) {
    response.status(error.status).json({
      error: { code: error.code, message: error.message, details: error.details },
    });
    return;
  }

  request.log.error({ err: error }, "request failed");
  response.status(500).json({
    error: { code: "internal_error", message: "The request could not be completed." },
  });
};

export function asyncHandler(
  handler: (request: Parameters<RequestHandler>[0], response: Parameters<RequestHandler>[1]) => Promise<void>,
): RequestHandler {
  return (request, response, next) => {
    handler(request, response).catch(next);
  };
}
