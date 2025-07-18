const path = require('path');
const fs = require('fs');
const logger = require('../logger');

require('dotenv').config();

let Gateway, Wallets, connectionProfile, wallet;

// Use mock Hyperledger client in test mode
if (process.env.TEST_MODE === 'true') {
    // Create mock Gateway class
    Gateway = function() {
        return {
            connect: async () => {},
            getNetwork: async () => ({
                getContract: () => ({
                    evaluateTransaction: async () => Buffer.from(JSON.stringify([{ key: 'value' }])),
                    submitTransaction: async () => Buffer.from('success')
                })
            }),
            disconnect: () => {}
        };
    };
    
    // Create mock connection profile and wallet
    connectionProfile = { name: 'mock-network' };
    wallet = { name: 'mock-wallet' };
    
    logger.info('Using mock Hyperledger client in test mode');
} else {
    try {
        // Try to load fabric-network, but don't fail if it's not available
        const fabricNetwork = require('fabric-network');
        Gateway = fabricNetwork.Gateway;
        Wallets = fabricNetwork.Wallets;
        
        const connectionProfilePath = process.env.HYPERLEDGER_CONNECTION_FILE || path.resolve(__dirname, '..', 'connection.json');
        
        if (fs.existsSync(connectionProfilePath)) {
            connectionProfile = JSON.parse(fs.readFileSync(connectionProfilePath, 'utf8'));
            
            const walletPath = path.resolve(__dirname, '..', 'wallet');
            if (!fs.existsSync(walletPath)) {
                fs.mkdirSync(walletPath, { recursive: true });
            }
            wallet = Wallets.newFileSystemWallet(walletPath);
        } else {
            logger.warn(`Hyperledger connection profile not found at ${connectionProfilePath}. Hyperledger operations will fail.`);
        }
    } catch (error) {
        logger.warn('Hyperledger module not available or initialization failed', { error: error.message });
    }
}

const CHANNEL_NAME = 'mychannel';
const CONTRACT_NAME = 'sqlContract';

const execute = async (type, table, fields, values, where) => {
    try {
        if (!Gateway || !Wallets || !connectionProfile || !wallet) {
            throw new Error('Hyperledger Fabric is not properly initialized');
        }
        
        logger.info(`Hyperledger Fabric: Executing operation: ${type}`, { table, fields, values, where });
        
        const gateway = new Gateway();
        await gateway.connect(connectionProfile, { wallet, identity: 'Admin', discovery: { enabled: true, asLocalhost: true } });

        const network = await gateway.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CONTRACT_NAME);

        let result;
        switch (type) {
            case 'select':
                result = await contract.evaluateTransaction('select', table, JSON.stringify(where));
                logger.info('Hyperledger Fabric: SELECT successful', { result: result.toString() });
                return JSON.parse(result.toString());
            case 'insert':
                await contract.submitTransaction('insert', table, JSON.stringify(fields), JSON.stringify(values));
                logger.info('Hyperledger Fabric: INSERT successful');
                return { status: 'INSERT successful' };
            case 'update':
                await contract.submitTransaction('update', table, JSON.stringify(fields), JSON.stringify(values), JSON.stringify(where));
                logger.info('Hyperledger Fabric: UPDATE successful');
                return { status: 'UPDATE successful' };
            case 'delete':
                await contract.submitTransaction('delete', table, JSON.stringify(where));
                logger.info('Hyperledger Fabric: DELETE successful');
                return { status: 'DELETE successful' };
            default:
                throw new Error(`Unsupported Hyperledger Fabric operation: ${type}`);
        }
    } catch (error) {
        logger.error(`Hyperledger Fabric: Operation failed: ${type}`, { error: error.message });
        throw error;
    } finally {
        try {
            if (gateway) gateway.disconnect();
        } catch (error) {
            // Ignore disconnect errors
        }
    }
};

module.exports = { execute };
