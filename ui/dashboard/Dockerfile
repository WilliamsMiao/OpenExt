FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
# Pass API and workspace paths as build args so Next.js/webpack bakes the correct
# values into the server bundle (process.env refs are inlined at build time).
ARG OPENCLAW_API=http://host.docker.internal:18789
ARG WORKSPACE_PATH=/app/workspace
ARG OPENCLAW_CONTAINER=openclaw
ENV OPENCLAW_API=$OPENCLAW_API
ENV WORKSPACE_PATH=$WORKSPACE_PATH
ENV OPENCLAW_CONTAINER=$OPENCLAW_CONTAINER
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Install docker CLI so /api/task can trigger openclaw agents via docker exec
RUN apk add --no-cache docker-cli
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["npm", "start"]
