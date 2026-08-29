# syntax=docker/dockerfile:1

# ------------------------------------------------------------------
# Stage 1: install dependencies
# ------------------------------------------------------------------
FROM oven/bun:1.2-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ------------------------------------------------------------------
# Stage 2: build (Next.js 16 / Turbopack, standalone output)
# ------------------------------------------------------------------
# Dependencies are installed with bun (stage 1), but the build runs under a
# real Node image: oven/bun aliases `node` to Bun, and Bun 1.2.23 segfaults
# running Next.js 16's Turbopack build on Linux.
FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV STANDALONE=true

# Public env vars are inlined at build time for client components.
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

# Grid/static prerendering imports the drizzle schema, which needs a
# connection string present at build time. A dummy value is sufficient.
ARG DATABASE_URL=postgres://user:pass@localhost:5432/db
ENV DATABASE_URL=$DATABASE_URL

RUN node node_modules/next/dist/bin/next build

# ------------------------------------------------------------------
# Stage 3: minimal runtime image
# ------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]