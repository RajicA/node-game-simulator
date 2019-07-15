const { Army } = require('../models/army');
const { isMongoIdValid, sendResponse, STATUSES } = require('../services/utils');

const clientApiKeyValidation = async (req, res, next) => {
  const { accessToken } = req.query;

  if (!accessToken) {
    return sendResponse(res, { message: 'Missing Access Token' }, STATUSES.BAD_REQUEST);
  }

  try {
    const armyDetails = isMongoIdValid(accessToken)
      ? await Army.findOne({ _id: accessToken }) : null;

    if (armyDetails) {
      return next();
    }

    return sendResponse(res, { message: 'Invalid Access Token' }, STATUSES.BAD_REQUEST);
  } catch (e) {
    return next(new Error(e));
  }
};

module.exports = { clientApiKeyValidation };
