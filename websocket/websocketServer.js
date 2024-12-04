const WebSocket = require('ws');
const sqlInterpreter = require('../sqlvm/sqlInterpreter');
const logger = require('../logger');
const {validateInput, validateToken} = require('../security');

const startWebSocketServer = (server) => {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws, req) => {
        const token = req.headers['authorization'];
        if (!validateToken(token)) {
            logger.warn('WebSocket: Unauthorized Access', { clientIP: req.socket.remoteAddress });
            ws.close();
        }

        ws.on('message', async (message) => {
            try {
                const { sql, adapter, options } = JSON.parse(message);
                validateInput(sql, adapter);
                const result = await sqlInterpreter.execute(sql, adapter, options || {});
                ws.send(JSON.stringify({ result }));
            } catch (error) {
                ws.send(JSON.stringify({ error: error.message }));
            }
        });
    });

    logger.info('WebSocket server running');
};

module.exports = { startWebSocketServer };
