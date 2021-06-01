const request = require('supertest');
const { app } = require('../app/server');
const { version } = require('../package.json');
const DB = require('../app/db');
const prtgService = require('../app/prtgService');

describe('Endpoints', () => {
    it('Check /health', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toBe(200);
    });
    it('Check /version', async () => {
        const res = await request(app).get('/api/version');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('version');
        expect(res.body.version).toBe(version);
    });

    it('Check /api', async () => {
        const prtgResponse = {
            data: {
                'prtg-version': '13.1.2.1462',
                treesize: 268,
                sensors: [
                    {
                        group: 'Hospital Centro Alfa',
                        device: 'Alfa 01',
                        device_raw: '',
                        sensor: 'Alfa 01',
                        status: 'Disponible',
                        status_raw: 3,
                    },
                    {
                        group: 'Hospital Centro Beta',
                        device: 'Alfa 02',
                        device_raw: '',
                        sensor: 'Alfa 02',
                        status: 'Falla',
                        status_raw: 3,
                    },

                    {
                        group: 'Hospital Centro Gamma',
                        device: 'Alfa 03',
                        device_raw: '',
                        sensor: 'Alfa 03',
                        status: 'Disponible',
                        status_raw: 3,
                    },
                ],
            },
        };

        const dbResponse = {
            recordset: [
                {
                    ultimoSyncFechaInicio: '2021-01-01T08:02:38.613Z',
                    ultimoSyncFechaFin: '2021-01-01T08:06:38.613Z',
                    tablaEncabezado: 'Prueba01',
                    tablaDetalle: 'PruebaDetalle01',
                    ultimoUpdateEfecrorInicio: '2021-01-01T08:02:38.613Z',
                    ultimoUpdateEfectorFin: '2021-01-01T08:06:38.613Z',
                    idEfector: 1,
                    ultimoSyncRegistrosDetalle: 123,
                    minutosMinimoSyncEfector: 1,
                    minutosMinimoSyncPrincipal: 2,
                    nombreEfector: 'Efector01',
                    sensorPingPRTG: 'Alfa 01',
                },
                {
                    ultimoSyncFechaInicio: '2021-01-01T08:02:38.613Z',
                    ultimoSyncFechaFin: '2021-01-01T08:06:38.613Z',
                    tablaEncabezado: 'Prueba01',
                    tablaDetalle: 'PruebaDetalle01',
                    ultimoUpdateEfecrorInicio: '2021-01-01T08:02:38.613Z',
                    ultimoUpdateEfectorFin: '2021-01-01T08:06:38.613Z',
                    idEfector: 1,
                    ultimoSyncRegistrosDetalle: 123,
                    minutosMinimoSyncEfector: 1,
                    minutosMinimoSyncPrincipal: 2,
                    nombreEfector: 'Efector01',
                    sensorPingPRTG: 'Alfa 02',
                },
                {
                    ultimoSyncFechaInicio: '2021-01-01T08:02:38.613Z',
                    ultimoSyncFechaFin: '2021-01-01T08:06:38.613Z',
                    tablaEncabezado: 'Prueba01',
                    tablaDetalle: 'PruebaDetalle01',
                    ultimoUpdateEfecrorInicio: '2021-01-01T08:02:38.613Z',
                    ultimoUpdateEfectorFin: '2021-01-01T08:06:38.613Z',
                    idEfector: 1,
                    ultimoSyncRegistrosDetalle: 123,
                    minutosMinimoSyncEfector: 1,
                    minutosMinimoSyncPrincipal: 2,
                    nombreEfector: 'Efector01',
                    sensorPingPRTG: 'Alfa 03',
                },
                {
                    ultimoSyncFechaInicio: '2021-01-01T08:02:38.613Z',
                    ultimoSyncFechaFin: '2021-01-01T08:06:38.613Z',
                    tablaEncabezado: 'Prueba01',
                    tablaDetalle: 'PruebaDetalle01',
                    ultimoUpdateEfecrorInicio: '2021-01-01T08:02:38.613Z',
                    ultimoUpdateEfectorFin: '2021-01-01T08:06:38.613Z',
                    idEfector: 1,
                    ultimoSyncRegistrosDetalle: 123,
                    minutosMinimoSyncEfector: 1,
                    minutosMinimoSyncPrincipal: 2,
                    nombreEfector: 'Efector01',
                    sensorPingPRTG: 'Alfa 04',
                },
            ],
        };
        const getPRTGStatusSpy = jest.spyOn(prtgService, 'getPRTGStatus');
        getPRTGStatusSpy.mockReturnValue(Promise.resolve(prtgResponse));
        const getSyncStatusSpy = jest.spyOn(DB, 'getSyncStatus');
        getSyncStatusSpy.mockReturnValue(Promise.resolve(dbResponse));

        const res = await request(app).get('/api');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body));
        expect(res.body.length).toEqual(4);

        const findBySensorPing = (data) => (sensor) => data.find((item) => item.sensorPingPRTG == sensor);
        const findInResponse = findBySensorPing(res.body);
        expect(findInResponse('Alfa 01'));
        expect(findInResponse('Alfa 01').pingStatus).toEqual('Disponible');

        expect(findInResponse('Alfa 02'));
        expect(findInResponse('Alfa 02').pingStatus).toEqual('Falla');

        expect(findInResponse('Alfa 03'));
        expect(findInResponse('Alfa 03').pingStatus).toEqual('Disponible');

        expect(findInResponse('Alfa 04'));
        expect(findInResponse('Alfa 04').pingStatus).toEqual('-');
    });
});
