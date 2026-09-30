import http from "node:http";
import { afterAll } from "vitest";

// Supertest creates and closes ephemeral app servers for these requests. Do not
// carry an idle socket into another fixture that happens to reuse that port.
// This applies only to the test runner, not the production API transport.
const original = http.globalAgent;
const isolated = new http.Agent({ keepAlive: false });
http.globalAgent = isolated;
afterAll(() => {
  isolated.destroy();
  http.globalAgent = original;
});
