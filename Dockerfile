# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY server/package.json ./

# Install dependencies
RUN npm install

# Copy server source code
COPY server/src ./src

# Copy public folder
COPY public ./public

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
