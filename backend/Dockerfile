# ---- Placera API image (Node.js + Express) ----
FROM node:20-alpine AS base

ENV NODE_ENV=production

WORKDIR /app

# Install production dependencies first for better layer caching
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy application source
COPY . .

EXPOSE 8000

# Production start. Override with `npm run dev` for hot reload in development.
CMD ["node", "server.js"]
