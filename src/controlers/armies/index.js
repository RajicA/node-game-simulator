const { Router: router } = require('express');
const { join } = require('./join');
const { leave } = require('./leave');
const { attack } = require('./attack');

const { clientApiKeyValidation } = require('../../middleware');

module.exports = (models, { config }) => {
  const api = router();

  api.post('/join', join(models, { config }));
  api.post('/leave', clientApiKeyValidation, leave(models, { config }));
  api.post('/attack/:armyId', clientApiKeyValidation, attack(models, { config }));

  return api;
};
