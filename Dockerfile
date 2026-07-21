FROM node:23-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the Next.js app
RUN npm run build

# Expose the configured port
EXPOSE 3005

# Start the application
CMD ["npm", "run", "start"]
