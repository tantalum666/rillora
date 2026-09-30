import type { Router } from "express";
import type { DatabasePool } from "./db.js";
export declare function createPlannerRecipientRehearsalRouter(pool: DatabasePool): Router;
export declare function createRecipientRehearsalRouter(pool: DatabasePool): Router;
declare global {
    namespace Express {
        interface Request {
            rehearsalSessionToken?: string;
        }
    }
}
