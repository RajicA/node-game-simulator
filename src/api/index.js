const express = require('express');

const { Army } = require('../models/army');
const armies = require('../controlers/armies');

const models = { Army };

const routersInit = (config) => {
  const router = express();

  router.use('/', armies(models, { config }));

  return router;
};

module.exports = routersInit;
