import { type DatabaseConfig } from "./config.js";
export declare function runMigrations(database: DatabaseConfig | string): Promise<void>;
