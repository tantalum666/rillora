import { isIP } from "node:net";
import { ipKeyGenerator } from "express-rate-limit";
import parseForwarded from "forwarded-parse";
export function createRateLimitKeyGenerator(trustedProxyHops) {
    return (request) => {
        const fallback = request.ip || request.socket.remoteAddress || "unknown";
        const forwarded = request.headers.forwarded;
        if (trustedProxyHops <= 0 || typeof forwarded !== "string") {
            return ipKeyGenerator(fallback);
        }
        try {
            const entries = parseForwarded(forwarded);
            const candidate = entries.at(-trustedProxyHops)?.for;
            const normalized = candidate ? normalizeForwardedAddress(candidate) : null;
            return ipKeyGenerator(normalized ?? fallback);
        }
        catch {
            // A malformed or obfuscated header fails closed to the trusted socket-derived key.
            return ipKeyGenerator(fallback);
        }
    };
}
function normalizeForwardedAddress(value) {
    if (isIP(value))
        return value;
    const bracketed = /^\[([^\]]+)](?::\d+)?$/.exec(value)?.[1];
    if (bracketed && isIP(bracketed))
        return bracketed;
    const ipv4WithPort = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/.exec(value)?.[1];
    if (ipv4WithPort && isIP(ipv4WithPort) === 4)
        return ipv4WithPort;
    return null;
}
