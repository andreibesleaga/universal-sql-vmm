FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install OpenSSL for certificate generation
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create directories for logs and certificates
RUN mkdir -p logs certs

# Generate self-signed certificates for development
RUN openssl genrsa -out certs/key.pem 2048 && \
    openssl req -new -key certs/key.pem -out certs/csr.pem -subj "/CN=localhost/O=Universal SQL VMM/C=US" && \
    openssl x509 -req -days 365 -in certs/csr.pem -signkey certs/key.pem -out certs/cert.pem && \
    rm certs/csr.pem

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HTTPS_PORT=3443

# Expose ports
EXPOSE 3000 3443 50051

# Start the application
CMD ["node", "index.js"]