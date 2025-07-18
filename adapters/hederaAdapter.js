const {
    Client,
    AccountId,
    PrivateKey,
    ContractExecuteTransaction,
    ContractCallQuery
} = require('@hashgraph/sdk');
const logger = require('../logger');

require('dotenv').config();

const HEDERA_OPERATOR_ID = process.env.HEDERA_OPERATOR_ID;
const HEDERA_OPERATOR_KEY = process.env.HEDERA_OPERATOR_KEY;

let client;
let CONTRACT_ID = process.env.HEDERA_CONTRACT_ID;

// Use mock Hedera client in test mode
if (process.env.TEST_MODE === 'true') {
    // Create mock client and contract functions
    client = {
        execute: () => Promise.resolve({ receipt: { status: { toString: () => 'SUCCESS' } } })
    };
    
    // Mock contract ID
    CONTRACT_ID = 'test-contract-id';
    
    logger.info('Using mock Hedera client in test mode');
} else {
    try {
        if (!HEDERA_OPERATOR_ID || !HEDERA_OPERATOR_KEY || !CONTRACT_ID) {
            logger.warn('Hedera credentials are not set. Hedera operations will fail.');
        } else {
            client = Client.forTestnet().setOperator(AccountId.fromString(HEDERA_OPERATOR_ID), PrivateKey.fromString(HEDERA_OPERATOR_KEY));
        }
    } catch (error) {
        logger.error('Hedera client initialization failed', { error: error.message });
    }
}

const execute = async (type, table, fields, values, where) => {
    try {
        logger.info(`Hedera: Executing operation: ${type}`, {
            table,
            fields,
            values,
            where
        });

        switch (type) {
            case 'select': {
                const query = new ContractCallQuery()
                    .setContractId(CONTRACT_ID)
                    .setFunction('selectRecord', [table, fields, where]);
                const result = await query.execute(client);
                const decodedResult = result.getString(0); // Assuming it returns a string
                logger.info('Hedera: SELECT successful', {
                    result: decodedResult
                });
                return {
                    result: decodedResult
                };
            }
            case 'insert': {
                const tx = new ContractExecuteTransaction()
                    .setContractId(CONTRACT_ID)
                    .setFunction('insertRecord', [table, fields.join(','), values.join(',')]);
                const receipt = await tx.execute(client).getReceipt(client);
                logger.info('Hedera: INSERT successful', {
                    status: receipt.status
                });
                return {
                    status: receipt.status.toString()
                };
            }
            case 'update': {
                const tx = new ContractExecuteTransaction()
                    .setContractId(CONTRACT_ID)
                    .setFunction('updateRecord', [table, fields.join(','), values.join(','), fields, where]);
                const receipt = await tx.execute(client).getReceipt(client);
                logger.info('Hedera: UPDATE successful', {
                    status: receipt.status
                });
                return {
                    status: receipt.status.toString()
                };
            }
            case 'delete': {
                const tx = new ContractExecuteTransaction()
                    .setContractId(CONTRACT_ID)
                    .setFunction('deleteRecord', [table, fields, values]);
                const receipt = await tx.execute(client).getReceipt(client);
                logger.info('Hedera: DELETE successful', {
                    status: receipt.status
                });
                return {
                    status: receipt.status.toString()
                };
            }
            default:
                throw new Error(`Unsupported Hedera operation: ${type}`);
        }
    } catch (error) {
        logger.error(`Hedera: Operation failed: ${type}`, {
            error: error.message
        });
        throw error;
    }
};

module.exports = {
    execute
};