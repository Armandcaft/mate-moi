# syntax=docker/dockerfile:1
FROM node:22-slim AS build
# better-sqlite3 compiles its native module when no prebuilt binary matches this Node.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000 \
    DATABASE_PATH=/data/mate-moi.db MIGRATIONS_PATH=/app/drizzle
# Litestream streams the SQLite file to object storage when LITESTREAM_REPLICA_URL is set.
COPY --from=litestream/litestream:0.3.13 /usr/local/bin/litestream /usr/local/bin/litestream
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY drizzle ./drizzle
COPY scripts ./scripts
COPY src/lib/server/pin.ts ./src/lib/server/pin.ts
COPY litestream.yml /etc/litestream.yml
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && mkdir -p /data
EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
