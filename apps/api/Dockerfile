# syntax=docker/dockerfile:1.7
FROM node:22.22.3-bookworm-slim AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
COPY migrations ./migrations
COPY certificates ./certificates
RUN npm run build && npm prune --omit=dev

FROM node:22.22.3-bookworm-slim AS runtime

ARG RDS_CA_BUNDLE_SHA256=e5bb2084ccf45087bda1c9bffdea0eb15ee67f0b91646106e466714f9de3c7e3
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    DATABASE_SSL_MODE=verify-full \
    DATABASE_SSL_CA_PATH=/app/certs/rds-global-bundle.pem

RUN apt-get update \
    && apt-get install --yes --no-install-recommends ca-certificates curl \
    && mkdir -p /app/certs \
    && curl --fail --show-error --silent \
      https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem \
      --output /app/certs/rds-global-bundle.pem \
    && echo "${RDS_CA_BUNDLE_SHA256}  /app/certs/rds-global-bundle.pem" | sha256sum --check --strict \
    && apt-get purge --yes --auto-remove curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --chown=node:node --from=build /app/package.json ./package.json
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=build /app/migrations ./migrations
COPY --chown=node:node --from=build /app/certificates ./certificates

USER node
EXPOSE 8080 8443

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "dist/healthcheck.js"]

CMD ["node", "dist/server.js"]
