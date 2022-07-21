const app = require('express')();
const cors = require('cors');
const dotenv = require('dotenv');
const { version } = require('../package.json');
const moment = require('moment');
const Ramda = require('ramda');
const DB = require('./db');
const prtgService = require('./prtgService');

dotenv.config();

app.use(
    cors({
        methods: ['GET', 'OPTIONS'],
    })
);

let connectionStatus = 'ok';

const updateStatus = (newStatus) => (connectionStatus = newStatus);

DB.onError(() => (connectionStatus = 'error'));

app.get('/api/version', (_, res) => {
    res.json({
        version,
    });
});

app.get('/api/health', (_, res) => {
    res.json({
        status: {
            app: 'ok',
            db: connectionStatus,
        },
    });
});

app.get('/api/unhealthy_endpoint', (_, res) => {
    const ok = Math.random() > 0 ? true : false;
    if (!ok) {
        res.status(500).json({ status: 'error' });
    } else {
        res.json({
            status: 'ok',
        });
    }
});

app.get('/api', async (_, res) => {
    const formatDate = (data) => moment.utc(data).utcOffset('-0300', true);
    const parsePrtgResponse = Ramda.pipe(
        Ramda.path(['data', 'sensors']),
        Ramda.map(Ramda.pick(['device', 'status', 'group', 'sensor']))
    );
    const doPRTGRequest = prtgService.getPRTGStatus;
    const getPRTGData = Ramda.pipe(
        doPRTGRequest,
        Ramda.otherwise((e) => {
            console.log('ERROR', e);
            return { data: { sensors: [] } };
        }),
        Ramda.andThen(parsePrtgResponse)
    );
    const getPingStatusBySensorName = (pingList) => (sensorName) =>
        Ramda.find((data) => data.sensor && data.sensor.toLowerCase().trim() == sensorName.toLowerCase().trim())(pingList);

    try {
        const prtgData = await getPRTGData();
        const findPingBySensor = getPingStatusBySensorName(prtgData);
        const pingStatus = (sensor) => (sensor ? (sensor.status == 'Disponible' ? 'Disponible' : 'Falla') : '-');

        const query = await DB.getSyncStatus();

        const response = query.recordset.map((row) => ({
            ...row,
            ultimoSyncFechaInicio: formatDate(row.ultimoSyncFechaInicio),
            ultimoSyncFechaFin: formatDate(row.ultimoSyncFechaFin),
            ultimoUpdateEfectorInicio: formatDate(row.ultimoUpdateEfectorInicio),
            ultimoUpdateEfectorFin: formatDate(row.ultimoUpdateEfectorFin),
            fechaUltimoEstudioMigrado: formatDate(row.fechaUltimoEstudioMigrado),
            pingStatus: row.sensorPingPRTG ? Ramda.pipe(findPingBySensor, pingStatus)(row.sensorPingPRTG) : '-',
        }));
        res.send(response);
    } catch (e) {
        console.log(e);
        res.status(500).json(e);
    }
});

module.exports = {
    app,
    connect: DB.connect,
    updateStatus,
};
