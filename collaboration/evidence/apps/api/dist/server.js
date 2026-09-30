import { createServer } from "node:http";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createPool, sweepContentOrphans } from "./db.js";
import { deletionProcessor } from "./account-deletion.js";
import { createManagedTlsServer } from "./managed-tls.js";
import { loadStripeProductionSecret } from './stripe-production-secret.js';
import { StripeCommerceExecutor } from './stripe-commerce-executor.js';
import { StripeProductionAdapter } from './stripe-production-adapter.js';
import { productionExecutionConfig } from './stripe-execution-config.js';
import { createAppleProductionIntake, createAppleReviewIntake } from './apple-production-runtime.js';
import { appleDeliveryMetrics } from './apple-production-metrics.js';
import { startRetentionWorker } from './retention.js';
const config = loadConfig();
const pool = createPool(config);
const accountDeletionProcessor = deletionProcessor(pool, config);
let transportReady = () => !config.apiTls;
const stripeProductionConfig = config.stripeProductionSecretArn ? await loadStripeProductionSecret(config.stripeProductionSecretArn) : undefined;
const stripeExecutor = stripeProductionConfig ? new StripeCommerceExecutor(pool, productionExecutionConfig(stripeProductionConfig), new StripeProductionAdapter(stripeProductionConfig)) : undefined;
const appleProductionIntake = config.appleProduction ? await createAppleProductionIntake(pool, config.appleProduction) : undefined;
const appleReviewIntake = config.appleReview ? await createAppleReviewIntake(pool, config.appleReview) : undefined;
const app = createApp(pool, config, { accountDeletionProcessor, transportReady: () => transportReady(),
    ...(appleReviewIntake ? { appleReviewIntake } : {}),
    ...(appleProductionIntake ? { appleProductionIntake } : {}),
    ...(stripeProductionConfig && stripeExecutor ? { stripeProductionConfig, stripeExecutor } : {}) });
let commerceRetryRunning = false;
const commerceTimer = stripeExecutor ? setInterval(() => {
    if (commerceRetryRunning)
        return;
    commerceRetryRunning = true;
    void stripeExecutor.retryPendingProviderEvents().then(result => {
        if (result.attempted)
            process.stdout.write(JSON.stringify({ event: 'commerce_retry', ...result }) + '\n');
    }).catch(() => process.stderr.write('Commerce retry pass failed.\n')).finally(() => { commerceRetryRunning = false; });
}, 300_000) : null;
commerceTimer?.unref();
const appleTimers = [appleProductionIntake, appleReviewIntake].flatMap(intake => {
    if (!intake)
        return [];
    let running = false;
    const timer = setInterval(() => {
        if (running)
            return;
        running = true;
        void intake.retryPending().then(result => {
            process.stdout.write(JSON.stringify(appleDeliveryMetrics(result, Date.now(), intake.context.environment)) + '\n');
        }).catch(() => process.stdout.write(JSON.stringify(appleDeliveryMetrics(null, Date.now(), intake.context.environment)) + '\n'))
            .finally(() => { running = false; });
    }, 30_000);
    timer.unref();
    return [timer];
});
const deletionTimer = setInterval(() => {
    if (!config.productionRuntimeClosed)
        void accountDeletionProcessor.process().catch(() => { process.stderr.write("Account deletion worker will retry.\n"); });
}, 30_000);
deletionTimer.unref();
const stopRetention = config.allowRetentionWorker ? startRetentionWorker(pool) : null;
let contentSweepRunning = false;
const contentTimer = config.contentProtection?.mode === "encrypted" ? setInterval(() => {
    if (contentSweepRunning)
        return;
    contentSweepRunning = true;
    void sweepContentOrphans(pool).catch(() => process.stderr.write("Private content maintenance will retry.\n"))
        .finally(() => { contentSweepRunning = false; });
}, 300_000) : null;
contentTimer?.unref();
const managedTls = config.apiTls ? await createManagedTlsServer(app, config.apiTls) : null;
const server = managedTls?.server ?? createServer(app);
if (managedTls)
    transportReady = managedTls.ready;
server.requestTimeout = 15_000;
server.headersTimeout = 20_000;
server.keepAliveTimeout = 5_000;
server.on("clientError", (_error, socket) => {
    if (socket.writable) {
        socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
    }
});
server.listen(config.port, config.host, () => {
    process.stdout.write(`Rillora API listening on ${config.host}:${config.port}\n`);
});
let shuttingDown = false;
async function shutdown(signal) {
    if (shuttingDown)
        return;
    shuttingDown = true;
    clearInterval(deletionTimer);
    stopRetention?.();
    if (commerceTimer)
        clearInterval(commerceTimer);
    appleTimers.forEach(clearInterval);
    managedTls?.close();
    if (contentTimer)
        clearInterval(contentTimer);
    process.stdout.write(`Received ${signal}; shutting down.\n`);
    server.close(async () => {
        await pool.end();
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
