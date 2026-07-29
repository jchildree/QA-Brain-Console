# Build context is the repo root (needed so the vault at ../../../qa-brain
# resolves the same way inside the container as it does on a dev machine --
# see app/backend/src/config.js VAULT_ROOT).
FROM node:22-alpine
WORKDIR /srv/app/backend

COPY app/backend/package.json app/backend/package-lock.json ./
RUN npm ci --omit=dev

COPY app/backend/src ./src

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "src/index.js"]
