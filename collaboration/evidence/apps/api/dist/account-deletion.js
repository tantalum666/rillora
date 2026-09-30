import { recentAuthenticationRequired } from "./recent-authentication.js";
import { createHash } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { withAuthDatabase, withPlannerDatabase } from "./db.js";
import { requireCsrf } from "./auth.js";
import { ApiError, asyncHandler } from "./errors.js";
const receiptPattern = /^[A-Za-z0-9_-]{43}$/;
const receiptHash = (value) => createHash("sha256").update(value).digest();
export class Auth0AccountIdentityDeleter {
    config;
    transport;
    token = null;
    constructor(config, transport = fetch) {
        this.config = config;
        this.transport = transport;
    }
    async deleteIdentity(identity) {
        if (!this.config.allowedIssuers.some(issuer => issuer.replace(/\/$/, "") === identity.issuer.replace(/\/$/, "")) || !identity.subject || identity.subject.length > 255)
            throw new Error("identity_scope_mismatch");
        if (!this.token || this.token.expiresAt < Date.now()) {
            const response = await this.transport(`https://${this.config.domain}/oauth/token`, {
                method: "POST", headers: { "content-type": "application/json" }, signal: AbortSignal.timeout(8000),
                body: JSON.stringify({ grant_type: "client_credentials", client_id: this.config.clientId, client_secret: this.config.clientSecret, audience: `https://${this.config.domain}/api/v2/` }),
            });
            if (!response.ok)
                throw new Error("identity_cleanup_unavailable");
            const result = await response.json();
            if (typeof result.access_token !== "string" || !Number.isFinite(result.expires_in))
                throw new Error("identity_cleanup_unavailable");
            this.token = { value: result.access_token, expiresAt: Date.now() + Math.max(0, Math.min(result.expires_in - 60, 3600)) * 1000 };
        }
        const response = await this.transport(`https://${this.config.domain}/api/v2/users/${encodeURIComponent(identity.subject)}`, {
            method: "DELETE", headers: { authorization: `Bearer ${this.token.value}` }, signal: AbortSignal.timeout(8000),
        });
        if (response.status === 401)
            this.token = null;
        // A retry after successful removal is also complete; never expose provider bodies.
        if (response.status !== 204 && response.status !== 404)
            throw new Error("identity_cleanup_unavailable");
    }
}
export class AccountDeletionProcessor {
    pool;
    deleter;
    running = false;
    constructor(pool, deleter) {
        this.pool = pool;
        this.deleter = deleter;
    }
    get identityCleanupConfigured() { return this.deleter !== null; }
    async process(publicId = null) {
        if (this.running)
            return;
        this.running = true;
        try {
            const job = await withAuthDatabase(this.pool, async (client) => (await client.query("select app.claim_account_deletion($1) as job", [publicId])).rows[0]?.job);
            if (!job)
                return;
            let success = false;
            try {
                if (job.identities.length && !this.deleter)
                    throw new Error("identity_cleanup_unavailable");
                for (const identity of job.identities)
                    await this.deleter.deleteIdentity(identity);
                success = true;
            }
            catch { /* Durable job retries. It is not reported as deleted. */ }
            await withAuthDatabase(this.pool, client => client.query("select app.finish_account_deletion($1,$2,$3)", [job.publicId, job.leaseToken, success]));
        }
        finally {
            this.running = false;
        }
    }
}
export function createAccountDeletionRouter(pool, processor, config) {
    const router = Router();
    router.post("/delete", recentAuthenticationRequired(config), requireCsrf, asyncHandler(async (request, response) => {
        const input = z.object({ confirmation: z.literal("DELETE"), receipt: z.string().regex(receiptPattern), acknowledgesSavedCopies: z.literal(true), acknowledgesBilling: z.boolean().optional() }).strict().parse(request.body);
        if (request.auth.mode !== "development" && !processor.identityCleanupConfigured)
            throw new ApiError(409, "account_deletion_unavailable", "Account deletion is temporarily unavailable. Your account is unchanged. Please try again later.");
        const hasBilling = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => (await client.query("select exists(select 1 from app.commerce_subscriptions where planner_id=app.current_planner_id()) as present")).rows[0].present);
        if (hasBilling && input.acknowledgesBilling !== true)
            throw new ApiError(400, "billing_confirmation_required", "Review your subscription billing before deleting this account.");
        const id = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => (await client.query("select app.request_account_deletion($1) as id", [receiptHash(input.receipt)])).rows[0].id);
        // The receipt was generated on the device before this request, so even a
        // dropped response cannot strand the user after their sessions are revoked.
        try {
            await processor.process(id);
        }
        catch { /* A leased job remains retryable. */ }
        const result = await deletionStatus(pool, input.receipt);
        response.status(result?.status === "completed" ? 200 : 202).json({ deletion: result });
    }));
    return router;
}
export function createPublicAccountDeletionRouter(pool) {
    const router = Router();
    router.get("/status", asyncHandler(async (request, response) => {
        const match = /^Deletion-Receipt ([A-Za-z0-9_-]{43})$/.exec(request.get("authorization") ?? "");
        if (!match?.[1])
            throw new ApiError(401, "receipt_required", "Use your deletion reference to check this request.");
        const result = await deletionStatus(pool, match[1]);
        if (!result)
            throw new ApiError(404, "receipt_unavailable", "This deletion reference is unavailable or its completed receipt has expired.");
        response.json({ deletion: result });
    }));
    return router;
}
async function deletionStatus(pool, receipt) {
    return withAuthDatabase(pool, async (client) => (await client.query("select app.account_deletion_status($1) as status", [receiptHash(receipt)])).rows[0]?.status ?? null);
}
export function deletionProcessor(pool, config, override) {
    return new AccountDeletionProcessor(pool, override ?? (config.accountDeletion ? new Auth0AccountIdentityDeleter(config.accountDeletion) : null));
}
