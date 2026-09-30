type QueueHealth = {
    pending: number;
    failed: number;
    oldestPendingSeconds: number;
};
/** CloudWatch EMF through the existing task log. No identifiers or payment bodies. */
export declare function appleDeliveryMetrics(health: QueueHealth | null, timestamp?: number, environment?: 'production' | 'sandbox'): {
    Heartbeat: number;
    WorkerErrors: number;
    Pending: number;
    Failed: number;
    OldestPendingSeconds: number;
    _aws: {
        Timestamp: number;
        CloudWatchMetrics: {
            Namespace: string;
            Dimensions: string[][];
            Metrics: {
                Name: string;
                Unit: string;
            }[];
        }[];
    };
    Environment: "production" | "sandbox";
    Provider: string;
} | {
    Pending?: never;
    Failed?: never;
    OldestPendingSeconds?: never;
    Heartbeat: number;
    WorkerErrors: number;
    _aws: {
        Timestamp: number;
        CloudWatchMetrics: {
            Namespace: string;
            Dimensions: string[][];
            Metrics: {
                Name: string;
                Unit: string;
            }[];
        }[];
    };
    Environment: "production" | "sandbox";
    Provider: string;
};
export {};
