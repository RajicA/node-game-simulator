const express = require('express');
const morgan = require('morgan');
const request = require('request');
const rp = require('request-promise');
const { sortBy, remove } = require('lodash');
const config = require('./config');

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const baseServerUrl = 'http://localhost:3000';

const { port } = config;
const joinUrl = `${baseServerUrl}/api/join`;
const leaveUrl = `${baseServerUrl}/api/leave`;
const attackUrl = `${baseServerUrl}/api/attack/:armyId`;

const clientData = {
  name: config.name,
  numberOfSquads: config.numberOfSquads,
  webhookUrl: config.webhookUrl,
  attackStrategy: config.strategy,
  armyId: null,
  accessToken: null,
  armiesToAttack: [],
  currentArmyToAttack: null,
  startedAttacks: false,
};

const setArmyToAttack = () => {
  const sorted = sortBy(clientData.armiesToAttack, ['squadsCount']);

  switch (clientData.attackStrategy) {
    case 'weakest':
      [clientData.currentArmyToAttack] = sorted;
      break;
    case 'strongest':
      clientData.currentArmyToAttack = sorted.pop();
      break;
    case 'random':
      clientData.currentArmyToAttack = clientData.armiesToAttack[Math.floor(Math.random()
        * clientData.armiesToAttack.length)];
      break;
    default:
      clientData.currentArmyToAttack = null;
  }
};

const attack = async () => {
  do {
    setArmyToAttack();

    console.log(`Attacking! - victim with ${clientData.currentArmyToAttack.squadsCount} squads`);
    const url = attackUrl.replace(':armyId', clientData.currentArmyToAttack.armyId);

    try {
    // eslint-disable-next-line no-await-in-loop
      const resp = await rp({
        method: 'POST',
        uri: `${url}?accessToken=${clientData.accessToken}`,
        body: {},
        json: true,
      });

      if (resp) {
        console.log(resp.message);
      }
    } catch (e) {
      console.log(e.message);
    }
  } while (clientData.numberOfSquads > 0 && clientData.armiesToAttack.length);

  if (clientData.numberOfSquads > 0 && !clientData.armiesToAttack.length) {
    console.log('===================================');
    console.log('You have WON!');
    console.log('===================================');
  }
};

app.post('/', (req, res) => {
  let army = null;

  switch (req.body.event) {
    case 'army.join':
      console.log('Army joined.');
      if (req.body.armyId !== clientData.armyId) {
        clientData.armiesToAttack.push(req.body);
        if (!clientData.startedAttacks) {
          attack();
          clientData.startedAttacks = true;
        }
      }
      break;
    case 'army.leave':
      if (req.body.armyId !== clientData.armyId) {
        console.log(`Army went away. Reason: ${req.body.typeOfLeave}`);
        remove(clientData.armiesToAttack, a => a.armyId === req.body.armyId);
      }
      break;
    case 'army.update':
      console.log('Army updated.');
      army = clientData.armiesToAttack.find(a => a.armyId === req.body.armyId);
      if (army) {
        army.squadsCount = req.body.squadsCount;
      }
      if (req.body.armyId === clientData.armyId) {
        clientData.numberOfSquads = req.body.squadsCount;
      }
      break;
    default: console.log('Unknown event type!');
  }

  res.sendStatus(200);
});

request.post(joinUrl, { json: clientData }, (error, res) => {
  if (error || res.body.error) {
    console.log(error || res.body.error);
    return;
  }

  clientData.accessToken = res.body.token;
  clientData.armyId = res.body.armyId;
  clientData.armiesToAttack.push(...res.body.joinedClients);

  if (!clientData.startedAttacks && clientData.armiesToAttack.length) {
    attack();
    clientData.startedAttacks = true;
  }
});

// eslint-disable-next-line no-unused-vars
const stop = () => {
  request.post(`${leaveUrl}?accessToken=${clientData.accessToken}`, { json: {} }, (error, res) => {
    if (error) {
      console.log(error);
      return;
    }
    console.log(res.body);
  });
};

// setTimeout(() => {
//   stop();
// }, 15000);

app.listen(port, () => console.log(`${config.name} app listening on port ${port}!`));
