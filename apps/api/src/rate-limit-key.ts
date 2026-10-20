import { isIP } from "node:net";
import type { Request } from "express";
import { ipKeyGenerator } from "express-rate-limit";
import parseForwarded from "forwarded-parse";

type RateLimitRequest = Pick<Request, "headers" | "ip" | "socket">;

export function createRateLimitKeyGenerator(trustedProxyHops: number) {
  if (trustedProxyHops !== 0 && trustedProxyHops !== 1) {
    throw new Error('Only the reviewed single-hop AWS HTTP API proxy contract is supported');
  }
  return (request: RateLimitRequest): string => {
    // AWS HTTP API appends its authoritative final Forwarded entry. If that
    // reserved-header contract is missing/malformed, never fall back to an
    // independently supplied X-Forwarded-For value through Express request.ip.
    const fallback = trustedProxyHops > 0 ? request.socket.remoteAddress || 'unknown'
      : request.ip || request.socket.remoteAddress || 'unknown';
    const forwarded = request.headers.forwarded;
    if (trustedProxyHops <= 0 || typeof forwarded !== "string") {
      return ipKeyGenerator(fallback);
    }

    try {
      const entries = parseForwarded(forwarded);
      const candidate = entries.at(-trustedProxyHops)?.for;
      const normalized = candidate ? normalizeForwardedAddress(candidate) : null;
      return ipKeyGenerator(normalized ?? fallback);
    } catch {
      // A malformed or obfuscated header fails closed to the trusted socket-derived key.
      return ipKeyGenerator(fallback);
    }
  };
}

function normalizeForwardedAddress(value: string): string | null {
  if (isIP(value)) return value;

  const bracketed = /^\[([^\]]+)](?::\d+)?$/.exec(value)?.[1];
  if (bracketed && isIP(bracketed)) return bracketed;

  const ipv4WithPort = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/.exec(value)?.[1];
  if (ipv4WithPort && isIP(ipv4WithPort) === 4) return ipv4WithPort;

  return null;
}
