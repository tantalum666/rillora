import { randomBytes, X509Certificate, createPrivateKey } from "node:crypto";
import { createServer, type Server } from "node:https";
import { createSecureContext, type SecureContextOptions } from "node:tls";
import type { RequestListener } from "node:http";
import { ACMClient, DescribeCertificateCommand, ExportCertificateCommand } from "@aws-sdk/client-acm";
import type { AppConfig } from "./config.js";

type TlsConfig = NonNullable<AppConfig["apiTls"]>;
export type CertificateMaterial = { certificate: string; chain: string; privateKey: string; passphrase: string };
export type CertificateSource = {
  serial(): Promise<string>;
  export(): Promise<CertificateMaterial>;
};
const DAY = 86_400_000;

export function validateCertificate(material: CertificateMaterial, hostname: string, now = Date.now()) {
  const certificate = new X509Certificate(material.certificate);
  const expires = Date.parse(certificate.validTo);
  if (certificate.ca || !certificate.checkHost(hostname, { wildcards: false })
    || Date.parse(certificate.validFrom) > now || expires < now + DAY) {
    throw new Error("TLS certificate name or validity rejected");
  }
  const key = createPrivateKey({ key: material.privateKey, passphrase: material.passphrase });
  if (!certificate.checkPrivateKey(key)) throw new Error("TLS key does not match certificate");
  const options: SecureContextOptions = {
    cert: material.certificate + "\n" + material.chain,
    key: material.privateKey, passphrase: material.passphrase, minVersion: "TLSv1.2",
  };
  createSecureContext(options);
  return { options, expires, serial: certificate.serialNumber };
}

export function acmSource(config: TlsConfig): CertificateSource {
  const client = new ACMClient({ region: config.region, maxAttempts: 3 });
  return {
    async serial() {
      const { Certificate: certificate } = await client.send(new DescribeCertificateCommand({ CertificateArn: config.certificateArn }));
      if (certificate?.Status !== "ISSUED" || certificate.Type !== "AMAZON_ISSUED"
        || certificate.DomainName !== config.serverName || !certificate.Serial) {
        throw new Error("Managed TLS certificate is not issued for this service");
      }
      return certificate.Serial.replace(/:/g, "").toUpperCase();
    },
    async export() {
      // An ephemeral passphrase protects the export response. Neither the key nor
      // the passphrase enters disk, environment variables, a build or a log.
      const passphrase = randomBytes(32).toString("hex");
      const result = await client.send(new ExportCertificateCommand({
        CertificateArn: config.certificateArn, Passphrase: Buffer.from(passphrase),
      }));
      if (!result.Certificate || !result.CertificateChain || !result.PrivateKey) throw new Error("Managed TLS export is incomplete");
      return { certificate: result.Certificate, chain: result.CertificateChain, privateKey: result.PrivateKey, passphrase };
    },
  };
}

export async function createManagedTlsServer(app: RequestListener, config: TlsConfig, source = acmSource(config)) {
  await source.serial();
  let current = validateCertificate(await source.export(), config.serverName);
  const server: Server = createServer(current.options, app);
  // Keep only non-secret metadata after OpenSSL has loaded the context.
  let serial = current.serial, expires = current.expires;
  let active = false;
  const refresh = async () => {
    if (active) return;
    active = true;
    try {
      if (await source.serial() !== serial) {
        const next = validateCertificate(await source.export(), config.serverName);
        server.setSecureContext(next.options);
        serial = next.serial; expires = next.expires;
        process.stdout.write("Managed TLS certificate renewed.\n");
      }
    } finally { active = false; }
  };
  // Do not retain the exported PEM/passphrase through this closure.
  current = { options: {}, expires, serial };
  const timer = setInterval(() => {
    void refresh().catch(() => process.stderr.write("Managed TLS refresh failed; the current certificate remains subject to its expiry.\n"));
  }, 15 * 60_000);
  timer.unref();
  const close = () => clearInterval(timer);
  server.once("close", close);
  return { server, refresh, close, ready: () => expires > Date.now() + DAY };
}
