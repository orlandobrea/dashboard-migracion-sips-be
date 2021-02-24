const request = require('supertest');
const { app } = require('../server');
const { version } = require('../package.json');

describe('Endpoints', () => {
  it('Check /health', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
  });
  it('Check /version', async () => {
    const res = await request(app).get('/version');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('version');
    expect(res.body.version).toBe(version);
  });
});
