import type { PoolClient, QueryResult, QueryResultRow } from "pg";
export type ContentProtectionConfig = Readonly<{
    mode: "read-compatible" | "encrypted";
    namespace: string;
    region: string;
    kmsKeyArn: string;
}>;
export type ContentKeyContext = Readonly<{
    namespace: string;
    owner: string;
    id: string;
}>;
export interface ContentKeyProvider {
    check(): Promise<void>;
    generate(context: ContentKeyContext): Promise<{
        plaintext: Buffer;
        wrapped: Buffer;
        wrappingKeyRef: string;
    }>;
    unwrap(wrapped: Buffer, wrappingKeyRef: string, context: ContentKeyContext): Promise<Buffer>;
}
export declare class KmsContentKeyProvider implements ContentKeyProvider {
    private readonly config;
    private readonly client;
    private healthPending;
    private healthValidUntil;
    private healthOK;
    constructor(config: ContentProtectionConfig);
    check(): Promise<void>;
    private probe;
    generate(context: ContentKeyContext): Promise<{
        plaintext: Buffer<ArrayBuffer>;
        wrapped: Buffer<ArrayBuffer>;
        wrappingKeyRef: string;
    }>;
    unwrap(wrapped: Buffer, wrappingKeyRef: string, context: ContentKeyContext): Promise<Buffer<ArrayBuffer>>;
}
type RawQuery = <R extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]) => Promise<QueryResult<R>>;
type Target = Readonly<{
    kind: "matter" | "person" | "snapshot" | "review_proposal";
    publicId: string;
}>;
export declare function contentReferenceId(value: unknown): string | null;
export declare const protectedSnapshotFields: Set<string>;
export declare class ContentSession {
    private readonly raw;
    private readonly config;
    private readonly provider;
    private readonly reviewPreview;
    private readonly keys;
    private wrote;
    constructor(raw: RawQuery, config: ContentProtectionConfig | null, provider: ContentKeyProvider | null, reviewPreview: boolean);
    private openKey;
    seal(target: Target, entries: Record<string, string | null | undefined>): Promise<{
        [x: string]: string | null | undefined;
    }>;
    open<T>(input: T): Promise<T>;
    prune(): Promise<void>;
    dispose(): void;
}
export declare function contentClient(client: PoolClient, config: ContentProtectionConfig | null, provider: ContentKeyProvider | null, reviewPreview: boolean): {
    client: PoolClient;
    session: ContentSession;
};
export declare function protectFields(client: PoolClient, target: Target, entries: Record<string, string | null | undefined>): Promise<{
    [x: string]: string | null | undefined;
} | {
    [x: string]: string | null | undefined;
}>;
export declare function protectMatterInput<T extends {
    title?: string | undefined;
    institutionName?: string | null | undefined;
    accountHint?: string | null | undefined;
    locationHint?: string | null | undefined;
    notes?: string | null | undefined;
    valueBand?: string | undefined;
    currencyCode?: string | null | undefined;
    details?: Record<string, string | undefined> | undefined;
}>(client: PoolClient, publicId: string, input: T): Promise<T>;
export declare function protectSnapshot<T>(client: PoolClient, publicId: string, snapshot: T, knownStoredReferences?: ReadonlySet<string>): Promise<T>;
export {};
