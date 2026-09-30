import type { AppConfig } from "./config.js";
import { type DatabasePool } from "./db.js";
export declare function createFamilyMaintenanceRouter(pool: DatabasePool, config: AppConfig): import("express-serve-static-core").Router;
