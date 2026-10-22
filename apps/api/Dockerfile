FROM node:22.23.4-bookworm-slim@sha256:de170b39439eb0e5a3444ad7d60b015614a381e10fecae2e30ec9e735122f38d AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
COPY migrations ./migrations
COPY certificates ./certificates
RUN npm run build && npm prune --omit=dev

FROM node:22.23.4-bookworm-slim@sha256:de170b39439eb0e5a3444ad7d60b015614a381e10fecae2e30ec9e735122f38d AS runtime

ARG RDS_CA_BUNDLE_SHA256=e5bb2084ccf45087bda1c9bffdea0eb15ee67f0b91646106e466714f9de3c7e3
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    DATABASE_SSL_MODE=verify-full \
    DATABASE_SSL_CA_PATH=/app/certs/rds-global-bundle.pem

COPY certificates/rds/global-bundle.pem /app/certs/rds-global-bundle.pem

RUN apt-get update \
    && apt-get install --yes --no-install-recommends ca-certificates \
    && echo "${RDS_CA_BUNDLE_SHA256}  /app/certs/rds-global-bundle.pem" | sha256sum --check --strict \
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
