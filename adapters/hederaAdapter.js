module.exports = {};
const { Client, AccountId, PrivateKey, ContractExecuteTransaction, ContractCallQuery } = require('@hashgraph/sdk');
const logger = require('../logger');

const HEDERA_OPERATOR_ID = process.env.HEDERA_OPERATOR_ID;
const HEDERA_OPERATOR_KEY = process.env.HEDERA_OPERATOR_KEY;
const CONTRACT_ID = process.env.HEDERA_CONTRACT_ID;

if (!HEDERA_OPERATOR_ID || !HEDERA_OPERATOR_KEY || !CONTRACT_ID) {
    throw new Error('Hedera credentials are not set.');
}

const client = Client.forTestnet().setOperator(AccountId.fromString(HEDERA_OPERATOR_ID), PrivateKey.fromString(HEDERA_OPERATOR_KEY));

const execute = async (type, table, fields, values, where) => {
    try {
        logger.info(`Hedera: Executing operation: ${type}`, { table, fields, values, where });

        switch (type) {
            case 'select': {
                const query = new ContractCallQuery()
                    .setContractId(CONTRACT_ID)
                    .setFunction('getRecord', [table]); // Example function
                const result = await query.execute(client);
                const decodedResult = result.getString(0); // Assuming it returns a string
                logger.info('Hedera: SELECT successful', { result: decodedResult });
                return { result: decodedResult };
            }
            case 'insert': {
                const tx = new ContractExecuteTransaction()
                    .setContractId(CONTRACT_ID)
                    .setFunction('insertRecord', [table, fields.join(','), values.join(',')]); // Example function
                const receipt = await tx.execute(client).getReceipt(client);
                logger.info('Hedera: INSERT successful', { status: receipt.status });
                return { status: receipt.status.toString() };
            }
            case 'update': {
                const tx = new ContractExecuteTransaction()
                    .setContractId(CONTRACT_ID)
                    .setFunction('updateRecord', [table, fields.join(','), values.join(',')]); // Example function
                const receipt = await tx.execute(client).getReceipt(client);
                logger.info('Hedera: UPDATE successful', { status: receipt.status });
                return { status: receipt.status.toString() };
            }
            case 'delete': {
                const tx = new ContractExecuteTransaction()
                    .setContractId(CONTRACT_ID)
                    .setFunction('deleteRecord', [table]); // Example function
                const receipt = await tx.execute(client).getReceipt(client);
                logger.info('Hedera: DELETE successful', { status: receipt.status });
                return { status: receipt.status.toString() };
            }
            default:
                throw new Error(`Unsupported Hedera operation: ${type}`);
        }
    } catch (error) {
        logger.error(`Hedera: Operation failed: ${type}`, { error: error.message });
        throw error;
    }
};

module.exports = { execute };
