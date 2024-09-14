const Balance = require('~/models/Balance');

async function balanceController(req, res) {
  const { tokenCredits: balance = '' } =
    (await Balance.findOne({ user: req.user.id }, 'tokenCredits')) ?? {};
  res.status(200).send('' + balance);
}

module.exports = balanceController;
