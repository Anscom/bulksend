FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/logger/package.json ./packages/logger/
COPY apps/worker/package.json ./apps/worker/
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/logger/node_modules ./packages/logger/node_modules
COPY --from=deps /app/apps/worker/node_modules ./apps/worker/node_modules
COPY . .
RUN cd apps/worker && npx prisma generate
RUN pnpm --filter=@bulksend/logger run build
RUN pnpm --filter=@bulksend/shared run build
RUN pnpm --filter=@bulksend/worker run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/apps/worker/dist ./apps/worker/dist
COPY --from=build /app/apps/worker/package.json ./apps/worker/
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/
COPY --from=build /app/packages/logger/dist ./packages/logger/dist
COPY --from=build /app/packages/logger/package.json ./packages/logger/
COPY --from=deps  /app/node_modules ./node_modules
# Re-create workspace symlinks for runtime Node.js resolution
RUN mkdir -p node_modules/@bulksend apps/worker/node_modules/@bulksend && \
    ln -s /app/packages/shared node_modules/@bulksend/shared && \
    ln -s /app/packages/logger node_modules/@bulksend/logger && \
    ln -s /app/packages/shared apps/worker/node_modules/@bulksend/shared && \
    ln -s /app/packages/logger apps/worker/node_modules/@bulksend/logger

EXPOSE 3002
CMD ["node", "apps/worker/dist/main.js"]
