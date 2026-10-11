import type { Request } from "express";
import { describe, expect, it } from "vitest";
import { createRateLimitKeyGenerator } from "../src/rate-limit-key.js";

function requestWith(forwarded: string | undefined, ip = "10.42.0.10") {
  return {
    headers: forwarded === undefined ? {} : { forwarded },
    ip,
    socket: { remoteAddress: ip },
  } as Pick<Request, "headers" | "ip" | "socket">;
}

describe("rate-limit request keys", () => {
  it("uses the nearest trusted Forwarded entry and ignores an earlier spoofed entry", () => {
    const key = createRateLimitKeyGenerator(1)(
      requestWith("for=192.0.2.44, for=198.51.100.27;host=api.example;proto=https"),
    );
    expect(key).toBe("198.51.100.27");
  });

  it("normalizes quoted IPv6 addresses before applying an IPv6 subnet key", () => {
    const key = createRateLimitKeyGenerator(1)(
      requestWith('for="[2001:db8:abcd:1234::7]:443"'),
    );
    expect(key).toBe("2001:db8:abcd:1200::/56");
  });

  it("ignores Forwarded when no trusted proxy hop is configured", () => {
    const key = createRateLimitKeyGenerator(0)(requestWith("for=198.51.100.27"));
    expect(key).toBe("10.42.0.10");
  });

  it("fails closed to the socket-derived key for malformed or obfuscated values", () => {
    const generateKey = createRateLimitKeyGenerator(1);
    expect(generateKey(requestWith("for=_hidden"))).toBe("10.42.0.10");
    expect(generateKey(requestWith("not a forwarded header"))).toBe("10.42.0.10");
  });
  it('does not fall back to spoofed X-Forwarded-For-derived request.ip and forbids selecting earlier untrusted hops', () => {
    const input={...requestWith('malformed'),ip:'192.0.2.99'};
    expect(createRateLimitKeyGenerator(1)(input)).toBe('10.42.0.10');
    expect(()=>createRateLimitKeyGenerator(2)).toThrow();
    for(const attacker of ['192.0.2.1','192.0.2.2','[2001:db8::1]']) {
      expect(createRateLimitKeyGenerator(1)(requestWith(`for="${attacker}", for=198.51.100.27`))).toBe('198.51.100.27');
    }
  });
});
