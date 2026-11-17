# The web app as one standalone Node server, the image Cloud Run runs.
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
# next.config.ts stops without DATABASE_URL. The build never connects, so a placeholder is enough.
RUN DATABASE_URL=postgresql://build@localhost/build pnpm --filter @moonlight/web build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=8080
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
USER node
EXPOSE 8080
CMD ["node", "apps/web/server.js"]
