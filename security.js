const crypto = require('crypto');
const jwtManager = require('./security/jwtManager');
const { validateRequest } = require('./utils/validator');

require('dotenv').config();

// Use fixed keys for development, in production these should be securely stored
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY || '01234567890123456789012345678901', 'utf8');
const IV = Buffer.from(process.env.ENCRYPTION_IV || '0123456789012345', 'utf8');

/**
 * Generate an application token for testing
 * @returns {String} JWT token
 */
const appToken = () => {
    return jwtManager.createToken({
        appId: 'UniversalSQLVMM',
        user: 'User',
        roles: ['user']
    });
};

/**
 * Encrypt data using AES-256-CBC
 * @param {Object} data - Data to encrypt
 * @returns {Object} Encrypted data with IV
 */
const encrypt = (data) => {
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
        iv: IV.toString('hex'),
        data: encrypted
    };
};

/**
 * Decrypt data using AES-256-CBC
 * @param {Object} encrypted - Encrypted data with IV
 * @returns {Object} Decrypted data
 */
const decrypt = (encrypted) => {
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, Buffer.from(encrypted.iv, 'hex'));
    let decrypted = decipher.update(encrypted.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
};

/**
 * Validate JWT token
 * @param {String} token - JWT token to validate
 * @returns {Object} Decoded token payload
 */
const validateToken = (token) => {
    return jwtManager.verifyToken(token);
};

/**
 * Encrypt response data
 * @param {Object} data - Data to encrypt
 * @returns {Object} Encrypted data with IV
 */
const encryptResponse = (data) => {
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
        iv: IV.toString('hex'),
        data: encrypted
    };
};

module.exports = {
    validateToken,
    encryptResponse,
    encrypt,
    decrypt,
    appToken
};