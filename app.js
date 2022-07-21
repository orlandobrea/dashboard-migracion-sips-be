const { app, connect, updateStatus } = require('./app/server');
const logger = require('pino');

const PORT = process.env.PORT ? process.env.PORT : 3000;

const server = app.listen(PORT, () => {
    connect(updateStatus);
    logger.info(`App running on port ${PORT}`);
});

module.exports = server;
