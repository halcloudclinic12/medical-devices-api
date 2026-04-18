# ---------- Stage 1: Build ----------
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json tsconfig.json ./
RUN npm ci

# Copy source files
COPY src ./src

# Build TypeScript code
RUN npm run build


# ---------- Stage 2: Run ----------
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Copy only built files and minimal required files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# COPY public ./public

# Set environment variable defaults (can override in docker run)
ENV NODE_ENV=production

# Expose port (make sure it matches config.SERVER_PORT)
EXPOSE 3000

# Start the app (adjust the path if needed)
CMD ["node", "dist/start.js"]
