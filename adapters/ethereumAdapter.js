const { ethers } = require('ethers');
const logger = require('../logger');

require('dotenv').config();

const RPC_URL = process.env.ETHEREUM_RPC_URL;
const PRIVATE_KEY = process.env.ETHEREUM_PRIVATE_KEY;

// Initialize provider, wallet, and contract variables
let provider, wallet, contract;

// Use mock Ethereum client in test mode
if (process.env.TEST_MODE === 'true') {
    // Create mock contract with all required functions
    contract = {
        selectRecords: async () => ({ result: 'mock data' }),
        insertRecord: async () => ({ 
            wait: async () => ({ status: 1, transactionHash: '0xmock' })
        }),
        updateRecords: async () => ({ 
            wait: async () => ({ status: 1, transactionHash: '0xmock' })
        }),
        deleteRecords: async () => ({ 
            wait: async () => ({ status: 1, transactionHash: '0xmock' })
        })
    };
    
    logger.info('Using mock Ethereum client in test mode');
} else {
    // Check for required environment variables
    if (!RPC_URL || !PRIVATE_KEY || !process.env.ETHEREUM_CONTRACT_ADDRESS) {
        logger.warn('Ethereum adapter: Missing environment variables. Ethereum operations will fail.');
    }

    try {
        // ethers v6 syntax
        provider = RPC_URL ? new ethers.JsonRpcProvider(RPC_URL) : null;
        wallet = (provider && PRIVATE_KEY) ? new ethers.Wallet(PRIVATE_KEY, provider) : null;
        
        // Load ABI from the contract file
        const contractABI = require('./contracts/ethereum/SqlContract.abi.json');
        const contractAddress = process.env.ETHEREUM_CONTRACT_ADDRESS;
        
        contract = (wallet && contractAddress && contractABI) ? 
            new ethers.Contract(contractAddress, contractABI, wallet) : null;
    } catch (error) {
        logger.error('Ethereum adapter initialization failed', { error: error.message });
    }
}

const execute = async (type, table, fields, values, where) => {
    try {
        logger.info(`Ethereum: Executing operation: ${type}`, { table, fields, values, where });

        switch (type) {
            case 'select': {
                const result = await contract.selectRecords(table, fields, values);
                logger.info('Ethereum: SELECT successful', { result });
                return { result };
            }
            case 'insert': {
                const tx = await contract.insertRecord(table, fields, values);
                const receipt = await tx.wait();
                logger.info('Ethereum: INSERT successful', { receipt });
                return { receipt };
            }
            case 'update': {
                const tx = await contract.updateRecords(table, fields, values, fields); 
                const receipt = await tx.wait();
                logger.info('Ethereum: UPDATE successful', { receipt });
                return { receipt };
            }
            case 'delete': {
                const tx = await contract.deleteRecords(table, fields, values);
                const receipt = await tx.wait();
                logger.info('Ethereum: DELETE successful', { receipt });
                return { receipt };
            }
            default:
                throw new Error(`Unsupported Ethereum operation: ${type}`);
        }
    } catch (error) {
        logger.error(`Ethereum: Operation failed: ${type}`, { error: error.message });
        throw error;
    }
};

module.exports = { execute, contract };
