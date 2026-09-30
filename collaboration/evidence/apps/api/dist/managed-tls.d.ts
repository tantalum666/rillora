import { type Server } from "node:https";
import { type SecureContextOptions } from "node:tls";
import type { RequestListener } from "node:http";
import type { AppConfig } from "./config.js";
type TlsConfig = NonNullable<AppConfig["apiTls"]>;
export type CertificateMaterial = {
    certificate: string;
    chain: string;
    privateKey: string;
    passphrase: string;
};
export type CertificateSource = {
    serial(): Promise<string>;
    export(): Promise<CertificateMaterial>;
};
export declare function validateCertificate(material: CertificateMaterial, hostname: string, now?: number): {
    options: SecureContextOptions;
    expires: number;
    serial: string;
};
export declare function acmSource(config: TlsConfig): CertificateSource;
export declare function createManagedTlsServer(app: RequestListener, config: TlsConfig, source?: CertificateSource): Promise<{
    server: Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>;
    refresh: () => Promise<void>;
    close: () => void;
    ready: () => boolean;
}>;
export {};
