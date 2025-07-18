/**
 * HTTPS Server utility for production use
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const logger = require('../logger');

/**
 * Create an HTTPS server from an Express app
 * @param {Object} app - Express application
 * @param {Object} options - HTTPS options
 * @returns {Object} HTTPS server
 */
const createHttpsServer = (app, options = {}) => {
  try {
    // Default options
    const defaultOptions = {
      keyPath: process.env.HTTPS_KEY_PATH || path.join(__dirname, '../certs/key.pem'),
      certPath: process.env.HTTPS_CERT_PATH || path.join(__dirname, '../certs/cert.pem'),
      port: process.env.HTTPS_PORT || 3443
    };

    // Merge options
    const serverOptions = { ...defaultOptions, ...options };

    // Check if certificate files exist
    if (!fs.existsSync(serverOptions.keyPath) || !fs.existsSync(serverOptions.certPath)) {
      throw new Error(`HTTPS certificate files not found at ${serverOptions.keyPath} or ${serverOptions.certPath}`);
    }

    // Read certificate files
    const httpsOptions = {
      key: fs.readFileSync(serverOptions.keyPath),
      cert: fs.readFileSync(serverOptions.certPath)
    };

    // Create HTTPS server
    const server = https.createServer(httpsOptions, app);

    // Start server
    server.listen(serverOptions.port, () => {
      logger.info(`HTTPS server running on port ${serverOptions.port}`);
    });

    return server;
  } catch (error) {
    logger.error('Failed to create HTTPS server', { error: error.message });
    throw error;
  }
};

/**
 * Generate self-signed certificates for development
 * @param {String} outputDir - Directory to save certificates
 * @returns {Object} Paths to generated files
 */
const generateSelfSignedCerts = (outputDir = path.join(__dirname, '../certs')) => {
  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Paths for key and certificate
    const keyPath = path.join(outputDir, 'key.pem');
    const certPath = path.join(outputDir, 'cert.pem');

    // Check if files already exist
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      logger.info('Self-signed certificates already exist');
      return { keyPath, certPath };
    }

    // Generate self-signed certificate using OpenSSL
    const { execSync } = require('child_process');
    
    // Generate private key
    execSync(`openssl genrsa -out ${keyPath} 2048`);
    
    // Generate self-signed certificate
    execSync(`openssl req -new -key ${keyPath} -out ${path.join(outputDir, 'csr.pem')} -subj "/CN=localhost/O=Universal SQL VMM/C=US"`);
    execSync(`openssl x509 -req -days 365 -in ${path.join(outputDir, 'csr.pem')} -signkey ${keyPath} -out ${certPath}`);
    
    // Clean up CSR file
    fs.unlinkSync(path.join(outputDir, 'csr.pem'));
    
    logger.info('Self-signed certificates generated successfully');
    return { keyPath, certPath };
  } catch (error) {
    logger.error('Failed to generate self-signed certificates', { error: error.message });
    throw error;
  }
};

module.exports = {
  createHttpsServer,
  generateSelfSignedCerts
};