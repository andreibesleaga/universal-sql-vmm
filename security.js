const jwt = require('jsonwebtoken');
const crypto = require('crypto');

require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET || 'default-jwt-secret-for-development';
// Use fixed keys for development, in production these should be securely stored
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY || '01234567890123456789012345678901', 'utf8');
const IV = Buffer.from(process.env.ENCRYPTION_IV || '0123456789012345', 'utf8');

const appToken = () => {
    return jwt.sign({
        appId: 'UniversalSQLVMM',
        user: 'User'
    }, SECRET_KEY, {
        expiresIn: '1h'
    });
}

const getSecret = () => {
    return SECRET_KEY;
}

const encrypt = (data) => {
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
        iv: IV.toString('hex'),
        data: encrypted
    };
};

const decrypt = (encrypted) => {
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, Buffer.from(encrypted.iv, 'hex'));
    let decrypted = decipher.update(encrypted.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
};

const validateToken = (token) => {
    try {
        if(token.startsWith('Bearer ')) {
            token = token.split(' ')[1];
        }
        // Remove console.log of token for security
        return jwt.verify(token, SECRET_KEY);
    } catch (error) {
        throw new Error('Invalid token');
    }
};

const validateInput = (sql, adapter) => {
    if (!sql || typeof sql !== 'string') throw new Error('Invalid SQL');
    if (!adapter || !['database', 'redis', 'sqlite', 'kafka', 'ethereum', 'hyperledger', 'hedera'].includes(adapter)) {
        throw new Error('Invalid adapter');
    }
};

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
    validateInput,
    encrypt,
    decrypt,
    appToken,
    getSecret,
};