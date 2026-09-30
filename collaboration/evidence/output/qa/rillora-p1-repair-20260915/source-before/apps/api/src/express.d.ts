import type { Logger } from "pino";

declare global {
  namespace Express {
    interface Request {
      auth: {
        plannerId: string;
        plannerPublicId: string;
        mode: "session" | "bearer" | "development";
        sessionPublicId?: string;
        csrfTokenHash?: Buffer;
        authenticationMethods?: string[];
        authenticatedAt?: Date | null;
        verifiedEmailHash?: Buffer;
      };
      log: Logger;
    }
  }
}

export {};
