const _ = require('lodash');
const { isMongoIdValid, STATUSES, sendResponse } = require('../../services/utils');
const { notifyAllClients } = require('../../services/army');

const join = ({ Army }) => async (req, res, next) => {
  try {
    const { accessToken } = req.query;

    if (accessToken) {
      const army = isMongoIdValid(accessToken)
        ? await Army.findOne({ _id: accessToken }) : null;

      if (army && !_.includes(['new', 'returned'], army.typeOfJoin)) {
        army.typeOfJoin = 'returned';
        await army.save();

        const payload = {
          armyId: army._id,
          squadsCount: army.numberOfSquads,
          typeOfJoin: army.typeOfJoin,
          event: 'army.join',
        };

        notifyAllClients(payload).then((result) => {
          console.log(result);
        }).catch((err) => {
          console.log(err);
        });

        const armies = await Army.find({ _id: { $ne: army._id } });

        const joinedClients = armies.map(a => ({
          armyId: a._id,
          squadsCount: a.numberOfSquads,
          typeOfJoin: a.typeOfJoin,
        }));

        return sendResponse(res, { joinedClients }, STATUSES.SUCCESS);
      }

      if (army && _.includes(['new', 'returned'], army.typeOfJoin)) {
        return sendResponse(res, { message: 'You are already joined!' }, STATUSES.BAD_REQUEST);
      }

      return sendResponse(res, { message: 'Invalid Access Token' }, STATUSES.FORBIDDEN);
    }

    if (req.body.numberOfSquads < 10 || req.body.numberOfSquads > 100) {
      return sendResponse(res, { message: 'Number of squads should be between 10 and 100!' }, STATUSES.BAD_REQUEST);
    }

    const army = new Army();

    _.extend(army, req.body);
    army.typeOfJoin = 'new';
    await army.save();

    if (army) {
      const payload = {
        armyId: army._id,
        squadsCount: army.numberOfSquads,
        typeOfJoin: army.typeOfJoin,
        event: 'army.join',
      };

      notifyAllClients(payload).then((result) => {
        console.log(result);
      }).catch((err) => {
        console.log(err);
      });
    }

    const armies = await Army.find({ _id: { $ne: army._id } });

    const joinedClients = armies.map(a => ({
      armyId: a._id,
      squadsCount: a.numberOfSquads,
      typeOfJoin: a.typeOfJoin,
    }));

    return sendResponse(
      res,
      { token: army._id, armyId: army._id, joinedClients },
      STATUSES.SUCCESS,
    );
  } catch (error) {
    return next(error);
  }
};

module.exports = { join };
