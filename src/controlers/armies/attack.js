const {
  notifyAllClients,
  checkIfAttackIsSucc,
  calculateDamage,
  calculateSecondsToWait,
} = require('../../services/army');

const { sendTimedoutResponse, STATUSES } = require('../../services/utils');

const attack = ({ Army }) => async (req, res, next) => {
  const { accessToken } = req.query;

  try {
    const attackerArmy = await Army.findOne({ _id: accessToken });
    const victimArmy = await Army.findOne({ _id: req.params.armyId });

    const secondsToWait = calculateSecondsToWait(attackerArmy);
    let damage = 0;

    if (!victimArmy) {
      return sendTimedoutResponse(
        res,
        { message: 'Army not found' },
        STATUSES.NOT_FOUND,
        secondsToWait,
      );
    }

    if (attackerArmy.tries === attackerArmy.numberOfSquads) {
      attackerArmy.tries = 1;
    } else {
      attackerArmy.tries += 1;
    }

    if (checkIfAttackIsSucc(attackerArmy)) {
      damage = calculateDamage(attackerArmy, victimArmy);

      if (victimArmy.numberOfSquads - damage > 0) {
        victimArmy.numberOfSquads -= damage;
      } else {
        victimArmy.numberOfSquads = 0;
        victimArmy.typeOfLeave = 'died';
      }

      victimArmy.save();

      attackerArmy.tries = 0;
      attackerArmy.save();

      const payload = {
        armyId: victimArmy._id,
        squadsCount: victimArmy.numberOfSquads,
      };

      if (!victimArmy.numberOfSquads) {
        payload.typeOfLeave = 'died';
        payload.event = 'army.leave';
      } else {
        payload.event = 'army.update';
      }

      notifyAllClients(payload).then((result) => {
        console.log(result);
      }).catch((err) => {
        console.log(err);
      });

      return sendTimedoutResponse(
        res,
        { message: `Target is hit. Damage made: ${damage}.` },
        STATUSES.SUCCESS,
        secondsToWait,
      );
    }

    attackerArmy.save();

    return sendTimedoutResponse(
      res,
      { message: 'Target is missed.' },
      STATUSES.SUCCESS,
      secondsToWait,
    );
  } catch (error) {
    return next(error);
  }
};

module.exports = { attack };
