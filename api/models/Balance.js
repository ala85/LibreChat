const dynamoose = require('dynamoose');
const balanceSchema = require('./schema/balance');
const { getMultiplier } = require('./tx');
const { logger } = require('~/config');

const Balance = dynamoose.model('Balance', balanceSchema)

Balance.findOne = async function (query) {
  try {
    const balance = await Balance.query(query).exec();
    return balance[0] || null;
  } catch (error) {
    throw new Error(`Failed to find balance: ${error.message}`);
  }
};

Balance.check = async function ({
  user,
  model,
  endpoint,
  valueKey,
  tokenType,
  amount,
  endpointTokenConfig,
}) {
  const multiplier = getMultiplier({ valueKey, tokenType, model, endpoint, endpointTokenConfig });
  const tokenCost = amount * multiplier;
  const { tokenCredits: balance } = (await this.findOne({ user }, 'tokenCredits').lean()) ?? {};

  logger.debug('[Balance.check]', {
    user,
    model,
    endpoint,
    valueKey,
    tokenType,
    amount,
    balance,
    multiplier,
    endpointTokenConfig: !!endpointTokenConfig,
  });

  if (!balance) {
    return {
      canSpend: false,
      balance: 0,
      tokenCost,
    };
  }

  logger.debug('[Balance.check]', { tokenCost });

  return { canSpend: balance >= tokenCost, balance, tokenCost };
};

module.exports = Balance;
