# syntax=docker/dockerfile:1

# ---- 构建前端 ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG GIT_HASH=unknown
ENV GIT_HASH=${GIT_HASH}
RUN npm run build-only

# ---- 运行：后端直接用 Node 运行 TypeScript（类型剥离），不需要编译 ----
FROM node:24-alpine
WORKDIR /app
ARG GIT_HASH=unknown
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=25780 \
    DATA_DIR=/data \
    STATIC_DIR=/app/dist \
    GIT_HASH=${GIT_HASH}
COPY package.json ./
COPY server ./server
COPY shared ./shared
COPY --from=build /app/dist ./dist
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME ["/data"]
EXPOSE 25780
HEALTHCHECK --interval=60s --timeout=5s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:25780/healthz >/dev/null || exit 1
CMD ["node", "server/index.ts"]
