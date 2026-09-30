import { type DatabasePool } from "./db.js";
export declare function migratePrivateContent(pool: DatabasePool): Promise<{
    owners: number;
    verifiedOwners: number;
    changedRows: number;
}>;
export declare function inspectPrivateContent(pool: Pick<DatabasePool, 'query'>): Promise<{
    owners: number;
    protectedValues: number;
    plaintextValues: number;
    invalidReferences: number;
}>;
export declare function enforcePrivateContent(pool: DatabasePool): Promise<{
    owners: number;
    protectedValues: number;
    plaintextValues: number;
    invalidReferences: number;
    enforced: boolean;
}>;
