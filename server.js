const app = require('express')();
const cors = require('cors');
const mssql = require('mssql');
const dotenv = require('dotenv');
const { version } = require('./package.json');
const moment = require('moment');
const R = require('ramda');
const axios = require('axios');

dotenv.config();

app.use(
    cors({
        methods: ['GET', 'OPTIONS'],
    })
);

let connectionStatus = 'ok';

mssql.on('error', (_) => (connectionStatus = 'error'));

const connect = async () => {
    console.log('prueba');
    try {
        await mssql.connect(
            `mssql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_SERVER}/${process.env.DB_DATABASE}`
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
    const formatDate = (data) => moment.utc(data).utcOffset('-0300', true);
    const isHospital = R.pipe(R.pick(['device']), (item) => item && item.device.toLowerCase().includes('hospi'));
    const parsePrtgResponse = R.pipe(
        R.path(['data', 'sensors']),
        // R.filter(isHospital),
        R.map(R.pick(['device', 'status', 'group', 'sensor']))
    );
    const doPRTGRequest = () =>
        axios.get(
            `${process.env.PRTG_SERVER}/api/table.json?content=sensors&username=${process.env.PRTG_USERNAME}&passhash=${process.env.PRTG_PASSWORD_HASH}`
        );
    const getPRTGData = R.pipe(
        doPRTGRequest,
        R.otherwise((e) => {
            console.log('ERROR', e);
            return { data: { sensors: [] } };
        }),
        R.andThen(parsePrtgResponse)
    );
    // const getPingStatusByHospitalName = pingList => hospitalName =>
    //     R.find(R.pipe(R.prop('device'), R.toLower(), R.includes(R.toLower(hospitalName))))(pingList);
    const getPingStatusBySensorName = (pingList) => (sensorName) =>
        R.find((data) => data.sensor && data.sensor.toLowerCase().trim() == sensorName.toLowerCase().trim())(pingList);

    try {
        const prtgData = await getPRTGData();
        const findPingBySensor = getPingStatusBySensorName(prtgData);
        // const findPingByHospitalName = getPingStatusByHospitalName(prtgData);
        const pingStatus = (sensor) => (sensor ? (sensor.status == 'Disponible' ? 'Disponible' : 'Falla') : '-');

        const query = await mssql.query(
            `select lesg.* 
      from SIPS.dbo.LAB_EstadoSyncGeneral lesg WITH (NOLOCK) `
        );
        const response = query.recordsets[0].map((row) => ({
            ...row,
            ultimoSyncFechaInicio: formatDate(row.ultimoSyncFechaInicio),
            ultimoSyncFechaFin: formatDate(row.ultimoSyncFechaFin),
            ultimoUpdateEfectorInicio: formatDate(row.ultimoUpdateEfectorInicio),
            ultimoUpdateEfectorFin: formatDate(row.ultimoUpdateEfectorFin),
            pingStatus: row.sensorPingPRTG
                ? R.pipe(findPingBySensor, pingStatus)(
                      row.sensorPingPRTG
                  )
                : '-',
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
