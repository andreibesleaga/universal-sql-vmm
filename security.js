const jwt = require('jsonwebtoken');
const crypto = require('crypto');

require('dotenv').config();

const SECRET_KEY = 'JWT_SECRET'; //process.env.JWT_SECRET;
const ENCRYPTION_KEY = crypto.randomBytes(32);
const IV = crypto.randomBytes(16);

const appToken = () => {
    return jwt.sign({
        appId: 'UniversalSQLVMM',
        permissions: ['execute']
    }, SECRET_KEY, {
        expiresIn: '1h'
    });
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
    appToken
};