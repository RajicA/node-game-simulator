const express = require('express');
const morgan = require('morgan');
const config = require('./config');
const { MongoManager } = require('./src/mongo');
const api = require('./src/api');
const { Army } = require('./src/models/army');

const app = express();
const mongoManager = new MongoManager(config);

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

mongoManager.connect(async () => {
  await Army.deleteMany({});
});

app.use('/api', api(config));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (!err.statusCode) {
    // eslint-disable-next-line no-param-reassign
    err.statusCode = 500;
  }
  res.status(err.statusCode).send({ error: err.message });
});

module.exports = app;
