const app = require('express')();
const cors = require('express-cors');
const mssql = require('mssql');
const dotenv = require('dotenv');
const { version } = require('./package.json');
const moment = require('moment');

dotenv.config();

app.use(
  cors({
    allowedOrigins: ['*'],
    methods: ['GET']
  }),
);

const connect = async () => {
  try {
    await mssql.connect(
      `mssql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_SERVER}/${process.env.DB_DATABASE}`,
    );
  } catch (err) {
    console.log(err);
  }
};

app.get('/version', (req, res) => {
  res.json({
    version: version,
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
  });
});

app.get('/', async (req, res) => {
  try {
    const formatDate = (data) => moment.utc(data).utcOffset('-0300', true);
    const query = await mssql.query(
      `select lesg.*, le.NombreServidor from SIPS.dbo.LAB_EstadoSyncGeneral lesg left join SIPS.dbo.LAB_Efector le on lesg.idEfector=le.idEfector`,
    );
    console.log(query.recordsets[0]);
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
