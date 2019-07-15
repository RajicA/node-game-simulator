const _ = require('lodash');
const { isMongoIdValid, STATUSES, sendResponse } = require('../../services/utils');
const { notifyAllClients } = require('../../services/army');

const leave = ({ Army }) => async (req, res, next) => {
  const { accessToken } = req.query;

  try {
    const army = isMongoIdValid(accessToken)
      ? await Army.findOne({ _id: accessToken }) : null;

    if (army) { // check if leave
      _.extend(army, { typeOfLeave: 'leave' });
      await army.save();

      const payload = {
        armyId: army._id,
        typeOfLeave: army.typeOfLeave,
        event: 'army.leave',
      };

      notifyAllClients(payload).then((result) => {
        console.log(result);
      }).catch((err) => {
        console.log(err);
      });

      return sendResponse(res, { message: 'You are leave!' }, STATUSES.SUCCESS);
    }

    return sendResponse(res, { message: 'You are already leave!' }, STATUSES.BAD_REQUEST);
  } catch (error) {
    return next(error);
  }
};

module.exports = { leave };
