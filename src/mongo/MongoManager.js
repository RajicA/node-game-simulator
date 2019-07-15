const mongoose = require('mongoose');
const assert = require('assert');

class MongoManager {
  constructor(config) {
    this.config = config;
  }

  getMongoUrl() {
    return this.config.MONGODB_URI;
  }

  connect(cb) {
    mongoose.connect(
      this.getMongoUrl(),
      { useNewUrlParser: true, useCreateIndex: true }, (err) => {
        assert.equal(null, err);
        console.log('Connected successfully to server!');
        if (cb) {
          cb();
        }
      },
    );
  }
}

module.exports = { MongoManager };
