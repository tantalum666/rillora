import type { ErrorRequestHandler, RequestHandler } from "express";
export declare class ApiError extends Error {
    readonly status: number;
    readonly code: string;
    readonly details?: unknown;
    constructor(status: number, code: string, message: string, details?: unknown);
}
export declare const notFoundHandler: RequestHandler;
export declare const errorHandler: ErrorRequestHandler;
export declare function asyncHandler(handler: (request: Parameters<RequestHandler>[0], response: Parameters<RequestHandler>[1]) => Promise<void>): RequestHandler;
