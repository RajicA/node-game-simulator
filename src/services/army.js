const async = require('async');
const request = require('request');
const mongoose = require('mongoose');
const { isEmpty } = require('lodash');
const { Army } = require('../models/army');

const notifyAllClients = async (payload) => {
  const clients = await Army.find({});

  const tasks = {};

  const objMaker = (client) => {
    tasks[client._id] = (cb) => {
      request.post(client.webhookUrl, { json: payload }, (error, res) => {
        cb(error, res ? res.statusCode : 500);
      });
    };
  };

  for (let i = 0; i < clients.length; i += 1) {
    objMaker(clients[i]);
  }

  return new Promise((resolve, reject) => {
    async.parallel(async.reflectAll(tasks),
      async (err, results) => {
        const response = { results };
        if (err) {
          return reject(err);
        }

        response.message = isEmpty(results) ? 'No clients to notify' : `Number of clients notified: ${clients.length}`;

        const clientKeys = Object.keys(response.results);
        const failedClients = [];

        for (let i = 0; i < clientKeys.length; i += 1) {
          if (response.results[clientKeys[i]].value !== 200) {
            failedClients.push(mongoose.Types.ObjectId(clientKeys[i]));
          }
        }

        if (failedClients.length) {
          console.log('Clients with non 200 responses', failedClients);
        }

        return resolve(response);
      });
  });
};

const checkIfAttackIsSucc = (army) => {
  const succAttackChance = 100 / army.numberOfSquads;
  const rnd = Math.floor(Math.random() * 100) + 1;

  if (rnd < succAttackChance) {
    return true;
  }

  return false;
};

const checkIfHalfDamage = (army) => {
  const halfDamageChance = Math.abs(army.numberOfSquads - 100);

  const rnd = Math.floor(Math.random() * 100) + 1;

  if (rnd < halfDamageChance) {
    return true;
  }

  return false;
};

const calculateDamage = (attackerArmy, victimArmy) => {
  let damage = attackerArmy.numberOfSquads / attackerArmy.tries;
  if (checkIfHalfDamage(victimArmy)) {
    damage /= 2;
  }

  return Math.round(damage);
};

const calculateSecondsToWait = attackerArmy => Math.round(attackerArmy.numberOfSquads / 10);

module.exports = {
  notifyAllClients,
  checkIfAttackIsSucc,
  checkIfHalfDamage,
  calculateDamage,
  calculateSecondsToWait,
};
