const app = require('express')();
const cors = require('cors');
const mssql = require('mssql');
const dotenv = require('dotenv');
const { version } = require('./package.json');
const moment = require('moment');

dotenv.config();

app.use(
  cors({
    methods: ['GET', 'OPTIONS'],
  }),
);

let connectionStatus = 'ok';

mssql.on('error', (_) => (connectionStatus = 'error'));

const connect = async () => {
  try {
    await mssql.connect(
      `mssql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_SERVER}/${process.env.DB_DATABASE}`,
    );
    connectionStatus = 'ok';
  } catch (err) {
    connectionStatus = 'error';
    console.log(err);
    setTimeout(() => connect(), 5000);
  }
};

app.get('/api/version', (req, res) => {
  res.json({
    version: version,
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: {
      app: 'ok',
      db: connectionStatus,
    },
  });
});

app.get('/api/unhealthy_endpoint', (req, res) => {
  const ok = Math.random() > 0 ? true : false;
  if (!ok) {
    res.status(500).json({ status: 'error' });
  } else {
    res.json({
      status: 'ok',
    });
  }
});

app.get('/api', async (req, res) => {
  try {
    const formatDate = (data) => moment.utc(data).utcOffset('-0300', true);
    const query = await mssql.query(
      `select lesg.* 
      from SIPS.dbo.LAB_EstadoSyncGeneral lesg WITH (NOLOCK) `,
    );
    const response = query.recordsets[0].map((row) => ({
      ...row,
      ultimoSyncFechaInicio: formatDate(row.ultimoSyncFechaInicio),
      ultimoSyncFechaFin: formatDate(row.ultimoSyncFechaFin),
      ultimoUpdateEfectorInicio: formatDate(row.ultimoUpdateEfectorInicio),
      ultimoUpdateEfectorFin: formatDate(row.ultimoUpdateEfectorFin),
    }));
    res.send(response);
  } catch (e) {
    res.status(500).json(e);
  }
});

module.exports = {
  app,
  connect,
};
