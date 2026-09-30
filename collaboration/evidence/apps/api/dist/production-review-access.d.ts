import type { AppConfig } from './config.js';
export declare function reviewIdentityDigest(issuer: string, subject: string): string;
export declare function reviewAccessOpen(config: AppConfig, now?: number): boolean;
export declare function reviewIdentityAllowed(config: AppConfig, digest: string, now?: number): boolean;
