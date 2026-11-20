FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.bundle.mjs ./server.bundle.mjs
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/server.ts ./server.ts

EXPOSE 3000

CMD ["node", "server.js"]
