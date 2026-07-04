# ---- Stage 1: production dependencies ----
FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ---- Stage 2: full build ----
FROM node:24-bookworm-slim AS builder
WORKDIR /app
COPY package*.json ./
# Tailwind v4 offloads CSS compilation to lightningcss, whose native binding ships as
# an optional dev-only package (lightningcss-linux-x64-gnu). `npm ci` can drop it in
# some build environments, which breaks `next build` with
# "Cannot find module '../lightningcss.linux-x64-gnu.node'". Install it explicitly.
# Keep this version in sync with `lightningcss` in package-lock.json (currently 1.32.0).
RUN npm ci \
 && npm install --no-save lightningcss-linux-x64-gnu@1.32.0
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- Stage 3: production runner ----
FROM node:24-bookworm-slim AS runner
RUN apt-get update \
  && apt-get install -y curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production

# Next.js standalone server
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma: migrations + CLI + generated client + query engines
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/engines ./node_modules/@prisma/engines

# Production node_modules (inclut tsx, csv-parse, etc.)
COPY --from=deps /app/node_modules ./node_modules
# Les engines Prisma doivent venir du builder (binaires spécifiques à l'OS)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/engines ./node_modules/@prisma/engines

# Scripts, lib et config pour setup.ts et les crons
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

RUN groupadd -r app && useradd -r -g app app
RUN chown -R app:app /app
USER app

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node_modules/.bin/tsx", "scripts/start.ts"]
