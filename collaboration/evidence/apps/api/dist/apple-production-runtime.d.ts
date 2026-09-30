import { AppleProductionIntake } from './apple-production-intake.js';
import type { DatabasePool } from './db.js';
export declare function createAppleProductionIntake(pool: DatabasePool, config: {
    secretArn: string;
    rootCertificateDirectory: string;
}): Promise<AppleProductionIntake>;
export declare function createAppleReviewIntake(pool: DatabasePool, config: {
    secretArn: string;
    rootCertificateDirectory: string;
}): Promise<AppleProductionIntake>;
