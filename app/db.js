const mssql = require('mssql');
const logger = require('pino');

const connect = async (cbUpdateStatus) => {
    try {
        await mssql.connect(
            `mssql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_SERVER}/${process.env.DB_DATABASE}`
        );
        cbUpdateStatus('ok');
    } catch (err) {
        cbUpdateStatus('error');
        logger.error(err);
        setTimeout(() => connect(), 5000);
    }
};

const onError = (cb) => mssql.on('error', cb);

const getSyncStatus = () =>
    mssql.query(
        `select lesg.* 
      from SIPS.dbo.LAB_EstadoSyncGeneral lesg WITH (NOLOCK) `
    );

module.exports = {
    connect,
    onError,
    getSyncStatus,
};
