import type { Request, RequestHandler } from 'express';
import type { AppConfig } from './config.js';
export declare const recentAuthenticationMilliseconds: number;
export declare function authenticationIsRecent(value: Date | null | undefined, now?: number): boolean;
export declare function requireRecentAuthentication(config: AppConfig, auth: Request['auth']): void;
/** Attach to the business route so authorization uses the same match as dispatch. */
export declare function recentAuthenticationRequired(config: AppConfig): RequestHandler;
type Grant = {
    matterPublicId: string;
    detailLevel: 'name' | 'directions' | 'details';
};
export declare function expandsSharing(previous: Grant[], next: Grant[]): boolean;
export {};
