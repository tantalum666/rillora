import { type Client as PgClient } from "pg";
export declare function bootstrapRuntimeRole(client: PgClient, runtimeUser: string, runtimePassword: string, rotateExistingPassword?: boolean): Promise<void>;
