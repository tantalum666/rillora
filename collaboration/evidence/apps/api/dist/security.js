import { randomUUID } from "node:crypto";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pino from "pino";
import { pinoHttp } from "pino-http";
import { ApiError } from "./errors.js";
import { createRateLimitKeyGenerator } from "./rate-limit-key.js";
export function installSecurityMiddleware(app, config, destination) {
    app.disable("x-powered-by");
    if (config.trustProxyHops > 0) {
        app.set("trust proxy", config.trustProxyHops);
    }
    app.use(pinoHttp({
        logger: pino({ level: config.nodeEnv === "test" ? "silent" : "info" }, destination),
        // OIDC query codes, invitation paths, addresses and SQL error text must
        // never enter request logs. Header redaction alone does not cover them.
        serializers: {
            req: (request) => ({ id: request.id, method: request.method }),
            res: (response) => ({ statusCode: response.statusCode }),
            err: () => ({ type: "Error", details: "omitted" }),
        },
        genReqId(_request, response) {
            const requestId = randomUUID();
            response.setHeader("x-request-id", requestId);
            return requestId;
        },
        redact: {
            paths: [
                "req.headers.authorization",
                "req.headers.cookie",
                "req.headers.x-csrf-token",
                "req.headers.stripe-signature",
                "req.headers.x-dev-planner-id",
                "req.headers.forwarded",
                "req.headers.x-forwarded-for",
                "res.headers.set-cookie",
            ],
            censor: "[REDACTED]",
        },
    }));
    app.use(helmet({
        crossOriginResourcePolicy: { policy: "same-site" },
        referrerPolicy: { policy: "no-referrer" },
    }));
    app.use(cors({
        credentials: true,
        methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: [
            "content-type",
            "authorization",
            "x-csrf-token",
            "x-dev-planner-id",
            "x-rillora-client",
            "x-rillora-planner",
            "x-request-id",
            "idempotency-key",
            "if-match",
        ],
        exposedHeaders: [
            "content-disposition",
            "x-request-id",
            "x-rillora-export-id",
            "x-rillora-server-copy-retained",
        ],
        origin(origin, callback) {
            if (!origin || config.corsOrigins.has(origin)) {
                callback(null, true);
                return;
            }
            callback(new ApiError(403, "origin_not_allowed", "This origin is not allowed."));
        },
    }));
    app.use(rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: config.nodeEnv === "test" ? 10_000 : 300,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        keyGenerator: createRateLimitKeyGenerator(config.trustProxyHops),
        message: {
            error: { code: "rate_limit_exceeded", message: "Too many requests. Try again later." },
        },
    }));
}
export const preventCaching = (_request, response, next) => {
    response.setHeader("cache-control", "no-store, max-age=0");
    response.setHeader("pragma", "no-cache");
    next();
};
