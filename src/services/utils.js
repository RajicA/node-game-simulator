const mongoose = require('mongoose');

const STATUSES = {
  SUCCESS: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
};

const isMongoIdValid = id => mongoose.Types.ObjectId.isValid(id);

const sendResponse = (
  res,
  data,
  status = STATUSES.SUCCESS,
) => res.status(status).json(data).end();

const sendTimedoutResponse = (
  res,
  data,
  status = STATUSES.SUCCESS,
  secondsToWait,
) => res.setTimeout(secondsToWait * 1000, () => {
  sendResponse(res, data, status);
});

module.exports = {
  isMongoIdValid,
  sendResponse,
  sendTimedoutResponse,
  STATUSES,
};
