# Production stage
FROM node:18-alpine

# Enable corepack to use pnpm
RUN corepack enable

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install

COPY . .

RUN pnpm run build

# Create non-root user
#RUN addgroup -g 1001 -S nodejs
#RUN adduser -S nextjs -u 1001

# Change ownership of the app directory
#RUN chown -R nextjs:nodejs /app
#USER nextjs

# Expose port (adjust as needed)
EXPOSE 3000

# Set entrypoint
ENTRYPOINT ["pnpm", "run", "start"]

