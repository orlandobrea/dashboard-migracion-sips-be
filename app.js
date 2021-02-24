const app = require('./server')

const server = app.listen(PORT, () => {
  connect();
  console.log(`App running on port ${PORT}`);
});

module.exports = {
    server
}
