const app = require('express')();
const cors = require('express-cors');
const mssql = require('mssql');
const dotenv = require('dotenv');

dotenv.config();
const PORT = process.env.PORT ? process.env.PORT : 3000;

app.use(
  cors({
    allowedOrigins: ['*'],
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


app.get('/health', (req, res) => {
  res.json({
    status: 'ok'
  })
})

app.get('/', async (req, res) => {
  try {
    const query = await mssql.query(
      `select lesg.*, le.NombreServidor from SIPS.dbo.LAB_EstadoSyncGeneral lesg left join SIPS.dbo.LAB_Efector le on lesg.idEfector=le.idEfector`,
    );
    res.send(query.recordsets[0]);
  } catch(e) {
    res.status(500).json(e);
  }
});

app.listen(PORT, () => {
  connect();
  console.log(`App running on port ${PORT}`);
});
