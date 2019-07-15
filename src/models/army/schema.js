const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  numberOfSquads: {
    type: Number,
    required: true,
  },
  webhookUrl: {
    type: String,
    required: true,
    unique: true,
  },
  typeOfJoin: {
    type: String,
    enum: ['new', 'returned'],
    required: true,
  },
  typeOfLeave: {
    type: String,
    enum: ['leave', 'died'],
  },
  tries: {
    type: Number,
    default: 0,
  },
});

schema.index({ name: 1, webhookUrl: 1 });

schema.post('save', (error, doc, next) => {
  if (error.name === 'MongoError' && error.code === 11000) {
    const err = new Error('An army with your name or webhook has already been joined!');
    err.statusCode = 400;
    next(err);
  } else {
    next(error);
  }
});

module.exports = { schema };
