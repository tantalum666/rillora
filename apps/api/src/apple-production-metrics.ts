type QueueHealth = { pending: number; failed: number; oldestPendingSeconds: number };

/** CloudWatch EMF through the existing task log. No identifiers or payment bodies. */
export function appleDeliveryMetrics(health: QueueHealth | null, timestamp = Date.now()) {
  const values = health ? { Heartbeat: 1, WorkerErrors: 0, Pending: health.pending,
    Failed: health.failed, OldestPendingSeconds: health.oldestPendingSeconds } : { Heartbeat: 1, WorkerErrors: 1 };
  return {
    _aws: { Timestamp: timestamp, CloudWatchMetrics: [{ Namespace: 'Rillora/Commerce',
      Dimensions: [['Environment', 'Provider']], Metrics: Object.keys(values).map(Name => ({
        Name, Unit: Name === 'OldestPendingSeconds' ? 'Seconds' : 'Count',
      })) }] },
    Environment: 'production', Provider: 'storekit', ...values,
  };
}
