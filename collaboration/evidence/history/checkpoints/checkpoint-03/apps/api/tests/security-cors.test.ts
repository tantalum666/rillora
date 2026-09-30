import express from "express";
import request from "./http-fixture.js";
import { describe, expect, it } from "vitest";
import { errorHandler } from "../src/errors.js";
import { installSecurityMiddleware } from "../src/security.js";

function application() {
  const app = express();
  installSecurityMiddleware(app, {
    nodeEnv: "test", trustProxyHops: 0,
    corsOrigins: new Set(["https://app.example"]),
  });
  app.use(errorHandler);
  return app;
}

describe("Browser role-revocation preflight", () => {
  it("allows the version condition from an approved Web origin", async () => {
    const response = await request(application()).options("/v1/role-assignments/test")
      .set("origin", "https://app.example")
      .set("access-control-request-method", "DELETE")
      .set("access-control-request-headers", "if-match,x-csrf-token,x-rillora-client");
    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe("https://app.example");
    expect((response.headers["access-control-allow-headers"] ?? "").split(",")).toContain("if-match");
    expect((response.headers["access-control-allow-methods"] ?? "").split(",")).toContain("DELETE");
  });
  it("keeps an unapproved origin blocked", async () => {
    const response = await request(application()).options("/v1/role-assignments/test")
      .set("origin", "https://unapproved.example")
      .set("access-control-request-method", "DELETE")
      .set("access-control-request-headers", "if-match");
    expect(response.status).toBe(403);
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
