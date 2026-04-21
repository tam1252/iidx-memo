FROM node:22-alpine AS base

# ---- 依存関係インストール ----
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- ビルド ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- 本番イメージ ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# standalone に必要な静的ファイルをコピー
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
