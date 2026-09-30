import type { Request } from "express";
type RateLimitRequest = Pick<Request, "headers" | "ip" | "socket">;
export declare function createRateLimitKeyGenerator(trustedProxyHops: number): (request: RateLimitRequest) => string;
export {};
