import type { Express, RequestHandler } from "express";
import { type DestinationStream } from "pino";
import type { AppConfig } from "./config.js";
export declare function installSecurityMiddleware(app: Express, config: Pick<AppConfig, "nodeEnv" | "trustProxyHops" | "corsOrigins">, destination?: DestinationStream): void;
export declare const preventCaching: RequestHandler;
