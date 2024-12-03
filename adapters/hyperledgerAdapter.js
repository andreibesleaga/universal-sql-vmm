const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const logger = require('../logger');

const connectionProfilePath = path.resolve(__dirname, '..', 'connection.json'); // Path to connection profile
const connectionProfile = JSON.parse(fs.readFileSync(connectionProfilePath, 'utf8'));

const walletPath = path.resolve(__dirname, '..', 'wallet');
const wallet = Wallets.newFileSystemWallet(walletPath);

const CHANNEL_NAME = 'mychannel';
const CONTRACT_NAME = 'sqlContract';

const execute = async (type, table, fields, values, where) => {
    const gateway = new Gateway();
    try {
        logger.info(`Hyperledger Fabric: Executing operation: ${type}`, { table, fields, values, where });

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
        gateway.disconnect();
    }
};

module.exports = { execute };
