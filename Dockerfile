# ── Base stage ────────────────────────────────────────────────
FROM node:24-alpine AS base
 
# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
 
WORKDIR /app
 
# Upgrade npm once, in the base stage (shared by all stages)
RUN npm install -g npm@latest
 
# Copy dependency manifests first (leverages layer cache)
COPY package*.json ./
 
# ── Development stage ─────────────────────────────────────────
FROM base AS development
 
# Install all dependencies (including devDependencies)
RUN npm install
 
# Copy source with correct ownership
COPY --chown=appuser:appgroup . .
 
USER appuser
 
EXPOSE 5173
 
CMD ["npm", "run", "dev", "--", "--host", "--port", "5173"]