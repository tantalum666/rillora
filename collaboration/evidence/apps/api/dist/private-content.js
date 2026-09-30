import { createCipheriv, createDecipheriv, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { DecryptCommand, GenerateDataKeyCommand, KMSClient } from "@aws-sdk/client-kms";
import { z } from "zod";
import { ApiError } from "./errors.js";
function keyContext(context) {
    return { rillora_application: "content-v1", rillora_environment: context.namespace,
        owner_id: context.owner, key_id: context.id };
}
export class KmsContentKeyProvider {
    config;
    client;
    healthPending = null;
    healthValidUntil = 0;
    healthOK = false;
    constructor(config) {
        this.config = config;
        this.client = new KMSClient({ region: config.region, maxAttempts: 2 });
    }
    async check() {
        if (Date.now() < this.healthValidUntil) {
            if (!this.healthOK)
                throw unavailable();
            return;
        }
        // One process-wide canary at most every five minutes (ten seconds on
        // failure); concurrent public readiness requests share the same probe.
        if (!this.healthPending)
            this.healthPending = this.probe().then(() => {
                this.healthOK = true;
                this.healthValidUntil = Date.now() + 300_000;
            }, () => {
                this.healthOK = false;
                this.healthValidUntil = Date.now() + 10_000;
                throw unavailable();
            }).finally(() => { this.healthPending = null; });
        return this.healthPending;
    }
    async probe() {
        const context = { namespace: this.config.namespace,
            owner: "00000000-0000-4000-8000-000000000000", id: randomUUID() };
        const generated = await this.generate(context);
        let opened;
        try {
            opened = await this.unwrap(generated.wrapped, generated.wrappingKeyRef, context);
            if (!timingSafeEqual(generated.plaintext, opened))
                throw unavailable();
        }
        finally {
            generated.plaintext.fill(0);
            opened?.fill(0);
        }
    }
    async generate(context) {
        const result = await this.client.send(new GenerateDataKeyCommand({
            KeyId: this.config.kmsKeyArn, KeySpec: "AES_256", EncryptionContext: keyContext(context),
        }), { abortSignal: AbortSignal.timeout(5000) });
        if (result.Plaintext?.byteLength !== 32 || !result.CiphertextBlob || result.KeyId !== this.config.kmsKeyArn) {
            result.Plaintext?.fill(0);
            throw unavailable();
        }
        const plaintext = Buffer.from(result.Plaintext);
        result.Plaintext.fill(0);
        return { plaintext, wrapped: Buffer.from(result.CiphertextBlob), wrappingKeyRef: result.KeyId };
    }
    async unwrap(wrapped, wrappingKeyRef, context) {
        if (wrappingKeyRef !== this.config.kmsKeyArn || context.namespace !== this.config.namespace)
            throw unavailable();
        const result = await this.client.send(new DecryptCommand({ KeyId: wrappingKeyRef,
            CiphertextBlob: wrapped, EncryptionContext: keyContext(context), EncryptionAlgorithm: "SYMMETRIC_DEFAULT" }), { abortSignal: AbortSignal.timeout(5000) });
        if (result.Plaintext?.byteLength !== 32 || result.KeyId !== this.config.kmsKeyArn) {
            result.Plaintext?.fill(0);
            throw unavailable();
        }
        const plaintext = Buffer.from(result.Plaintext);
        result.Plaintext.fill(0);
        return plaintext;
    }
}
const uuid = z.uuid();
const keySchema = z.object({ id: uuid, owner: uuid, namespace: z.string().min(1).max(80),
    wrappingKeyRef: z.string().min(1).max(2048), wrappedKey: z.string().max(12000) });
const targetSchema = z.object({ owner: uuid, sourceKind: z.enum(["matter", "person", "snapshot"]), sourceId: uuid });
const storedValueSchema = targetSchema.extend({ id: uuid, keyId: uuid, field: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_.]{0,79}$/),
    nonce: z.string().max(32), ciphertext: z.string().max(90000), tag: z.string().max(32) });
const referencePattern = /^rce1_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;
export function contentReferenceId(value) {
    return typeof value === "string" ? referencePattern.exec(value)?.[1] ?? null : null;
}
function unavailable() {
    return new ApiError(503, "protected_content_unavailable", "Your private information could not be opened safely. Try again shortly.");
}
function aad(value, namespace) {
    return Buffer.from(JSON.stringify(["rillora-private-content", 1, namespace,
        value.owner, value.keyId, value.id, value.sourceKind, value.sourceId, value.field]), "utf8");
}
function bytes(value, exact) {
    // PostgreSQL's base64 encoder inserts newlines; ignore whitespace only.
    const clean = value.replace(/\s/g, "");
    const result = Buffer.from(clean, "base64");
    if (result.toString("base64") !== clean || (exact !== undefined && result.length !== exact))
        throw unavailable();
    return result;
}
export const protectedSnapshotFields = new Set([
    "title", "institutionName", "locationHint", "accountHint", "notes", "displayName", "display_name", "personName",
    "relationshipLabel", "relationship_label", "ownerName", "valueBand", "currencyCode",
    "assetType", "debtType", "documentType", "deviceModel", "billingCycle", "renewalDate", "cryptoCustody",
    "network", "walletAddress", "walletLabel", "assetSymbol",
]);
const sessions = new WeakMap();
export class ContentSession {
    raw;
    config;
    provider;
    reviewPreview;
    keys = new Map();
    wrote = false;
    constructor(raw, config, provider, reviewPreview) {
        this.raw = raw;
        this.config = config;
        this.provider = provider;
        this.reviewPreview = reviewPreview;
    }
    async openKey(key) {
        if (!this.config || !this.provider || key.namespace !== this.config.namespace)
            throw unavailable();
        const existing = this.keys.get(key.id);
        if (existing)
            return existing;
        const plaintext = await this.provider.unwrap(bytes(key.wrappedKey), key.wrappingKeyRef, key);
        if (plaintext.length !== 32) {
            plaintext.fill(0);
            throw unavailable();
        }
        this.keys.set(key.id, plaintext);
        return plaintext;
    }
    async seal(target, entries) {
        if (!this.config || this.config.mode !== "encrypted")
            return { ...entries };
        if (!this.provider)
            throw unavailable();
        const present = Object.entries(entries).filter(([, value]) => value != null && value !== "");
        if (!present.length)
            return { ...entries };
        try {
            const response = await this.raw("select app.content_key_for_write($1,$2,$3) as info", [target.kind, target.publicId, this.reviewPreview]);
            const info = z.object({ target: targetSchema, key: keySchema.nullable() }).parse(response.rows[0].info);
            let key;
            if (!info.key) {
                const id = randomUUID();
                const generated = await this.provider.generate({ namespace: this.config.namespace, owner: info.target.owner, id });
                if (generated.plaintext.length !== 32) {
                    generated.plaintext.fill(0);
                    throw unavailable();
                }
                key = { id, owner: info.target.owner, namespace: this.config.namespace,
                    wrappingKeyRef: generated.wrappingKeyRef, wrappedKey: generated.wrapped.toString("base64") };
                this.keys.set(id, generated.plaintext);
                await this.raw("select app.content_register_key($1,$2,$3,$4,$5,$6,$7)", [target.kind, target.publicId, id, key.namespace, key.wrappingKeyRef, generated.wrapped, this.reviewPreview]);
            }
            else
                key = info.key;
            const plaintextKey = await this.openKey(key);
            const values = [];
            const result = { ...entries };
            for (const [field, plaintext] of present) {
                if (!/^[a-zA-Z][a-zA-Z0-9_.]{0,79}$/.test(field) || !plaintext.isWellFormed() || Buffer.byteLength(plaintext) > 65536)
                    throw unavailable();
                const id = randomUUID();
                const nonce = randomBytes(12);
                const cipher = createCipheriv("aes-256-gcm", plaintextKey, nonce, { authTagLength: 16 });
                cipher.setAAD(aad({ ...info.target, id, keyId: key.id, field }, key.namespace));
                const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
                values.push({ id, keyId: key.id, field, nonce: nonce.toString("base64"), ciphertext: ciphertext.toString("base64"), tag: cipher.getAuthTag().toString("base64") });
                result[field] = `rce1_${id}`;
            }
            await this.raw("select app.content_store_values($1,$2,$3::jsonb,$4)", [target.kind, target.publicId, JSON.stringify(values), this.reviewPreview]);
            this.wrote = true;
            return result;
        }
        catch (error) {
            // A recipient losing review permission is a business refusal, not a KMS
            // outage. Keep the existing403 contract and roll back any partial work.
            if (target.kind === "review_proposal" && error && typeof error === "object"
                && "code" in error && error.code === "P0001"
                && "message" in error && error.message === "content_access_denied") {
                throw new ApiError(403, "review_unavailable", "This review action is no longer available to this account.");
            }
            throw unavailable();
        }
    }
    async open(input) {
        const ids = new Set();
        let nodes = 0;
        const visit = (value, depth = 0) => {
            if (++nodes > 500000 || depth > 40 || ids.size > 20000)
                throw unavailable();
            const id = contentReferenceId(value);
            if (id) {
                ids.add(id);
                return;
            }
            if (Array.isArray(value))
                for (const entry of value)
                    visit(entry, depth + 1);
            else if (value && typeof value === "object" && !Buffer.isBuffer(value) && !(value instanceof Date))
                for (const entry of Object.values(value))
                    visit(entry, depth + 1);
        };
        visit(input);
        if (!ids.size)
            return input;
        if (!this.config || !this.provider)
            throw unavailable();
        try {
            const result = await this.raw("select app.content_read_values($1::uuid[],$2) as content", [[...ids], this.reviewPreview]);
            const content = z.object({ values: z.array(storedValueSchema), keys: z.array(keySchema) }).parse(result.rows[0].content);
            if (content.values.length !== ids.size || new Set(content.values.map(v => v.id)).size !== ids.size)
                throw unavailable();
            const keys = new Map(content.keys.map(k => [k.id, k]));
            const opened = new Map();
            for (const value of content.values) {
                if (!ids.has(value.id))
                    throw unavailable();
                const key = keys.get(value.keyId);
                if (!key || key.owner !== value.owner)
                    throw unavailable();
                const decipher = createDecipheriv("aes-256-gcm", await this.openKey(key), bytes(value.nonce, 12), { authTagLength: 16 });
                decipher.setAAD(aad(value, key.namespace));
                decipher.setAuthTag(bytes(value.tag, 16));
                const plaintext = Buffer.concat([decipher.update(bytes(value.ciphertext)), decipher.final()]);
                try {
                    opened.set(value.id, new TextDecoder("utf-8", { fatal: true }).decode(plaintext));
                }
                finally {
                    plaintext.fill(0);
                }
            }
            const replace = (value) => {
                const id = contentReferenceId(value);
                if (id) {
                    if (!opened.has(id))
                        throw unavailable();
                    return opened.get(id);
                }
                if (Array.isArray(value))
                    return value.map(replace);
                if (value && typeof value === "object" && !Buffer.isBuffer(value) && !(value instanceof Date))
                    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, replace(v)]));
                return value;
            };
            // Decrypted user text is returned once, never recursively treated as a ref.
            return replace(input);
        }
        catch {
            throw unavailable();
        }
    }
    async prune() { if (this.wrote)
        await this.raw("select app.content_prune_unused()"); }
    dispose() { for (const key of this.keys.values())
        key.fill(0); this.keys.clear(); }
}
export function contentClient(client, config, provider, reviewPreview) {
    const raw = (text, values) => client.query(text, values);
    const session = new ContentSession(raw, config, provider, reviewPreview);
    const proxy = new Proxy(client, {
        get(target, property) {
            if (property === "query")
                return async (text, values) => {
                    const result = await raw(text, values);
                    return { ...result, rows: await session.open(result.rows) };
                };
            const value = Reflect.get(target, property);
            return typeof value === "function" ? value.bind(target) : value;
        },
    });
    sessions.set(proxy, session);
    return { client: proxy, session };
}
export async function protectFields(client, target, entries) {
    const session = sessions.get(client);
    return session ? session.seal(target, entries) : { ...entries };
}
export async function protectMatterInput(client, publicId, input) {
    const mapping = { title: "title", institutionName: "institution_name", accountHint: "account_hint", locationHint: "location_hint",
        notes: "notes", valueBand: "value_band", currencyCode: "currency_code" };
    const entries = {};
    for (const [key, field] of Object.entries(mapping))
        if (Object.hasOwn(input, key))
            entries[field] = input[key];
    for (const [field, value] of Object.entries(input.details ?? {}))
        entries[`details.${field}`] = value;
    const stored = await protectFields(client, { kind: "matter", publicId }, entries);
    const result = { ...input };
    for (const [key, field] of Object.entries(mapping))
        if (Object.hasOwn(input, key))
            result[key] = stored[field];
    if (input.details)
        result.details = Object.fromEntries(Object.keys(input.details).map(k => [k, stored[`details.${k}`]]));
    return result;
}
export async function protectSnapshot(client, publicId, snapshot, knownStoredReferences) {
    let count = 0;
    const entries = {};
    const markers = new WeakMap();
    const collect = (value) => {
        if (Array.isArray(value))
            return value.map(collect);
        if (value && typeof value === "object")
            return Object.fromEntries(Object.entries(value).map(([k, v]) => {
                if (protectedSnapshotFields.has(k) && typeof v === "string" && v !== "") {
                    const id = contentReferenceId(v);
                    if (id && knownStoredReferences?.has(id))
                        return [k, v];
                    const field = `value${count++}`;
                    entries[field] = v;
                    const marker = {};
                    markers.set(marker, field);
                    return [k, marker];
                }
                return [k, collect(v)];
            }));
        return value;
    };
    const marked = collect(snapshot);
    const stored = await protectFields(client, { kind: "snapshot", publicId }, entries);
    const finish = (value) => {
        if (Array.isArray(value))
            return value.map(finish);
        if (value && typeof value === "object") {
            const record = value;
            const field = markers.get(record);
            if (field)
                return stored[field];
            return Object.fromEntries(Object.entries(record).map(([k, v]) => [k, finish(v)]));
        }
        return value;
    };
    return finish(marked);
}
