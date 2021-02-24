const {app, connect} = require('./server')

const PORT = process.env.PORT ? process.env.PORT : 3000;

const server = app.listen(PORT, () => {
  connect();
  console.log(`App running on port ${PORT}`);
});

