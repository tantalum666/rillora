import { createServer, type Server, type RequestListener } from "node:http";
import supertest from "supertest";
import { afterAll } from "vitest";

// Keep one listener per Express fixture. Opening/closing an ephemeral listener
// for every assertion can reuse ports while earlier sockets are still closing.
const listeners = new Map<Function, Server>();
function persistent(app: Parameters<typeof supertest>[0]) {
  if (typeof app !== "function") return app;
  let server = listeners.get(app);
  if (!server) {
    server = createServer(app as RequestListener);
    server.listen(0);
    listeners.set(app, server);
  }
  return server;
}
const request = Object.assign(
  ((app, options) => supertest(persistent(app), options)) as typeof supertest,
  supertest,
  { agent: (app: Parameters<typeof supertest.agent>[0], options?: Parameters<typeof supertest.agent>[1]) => supertest.agent(app ? persistent(app) : undefined, options) },
);
afterAll(async () => {
  await Promise.all([...listeners.values()].map(server => new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
    server.closeIdleConnections();
  })));
  listeners.clear();
});
export default request;
