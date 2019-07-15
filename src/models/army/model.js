const mongoose = require('mongoose');
const { schema } = require('./schema');

const Army = mongoose.model('Army', schema);

module.exports = { Army };
