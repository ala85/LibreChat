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

Balance.findOneAndUpdate = async function (searchCriteria, updateData, options = {}) {
  const { upsert = false, new: returnNew = false } = options;

  try {
    console.log("Balance.findOneAndUpdate")
    let result = await Balance.query(searchCriteria).exec();
    console.log(searchCriteria)
    console.log(result.length)
    console.log(updateData)

    if (result.length === 0) {
      if (upsert) {
        updateData.user = searchCriteria.user;
        result = await new Balance(updateData).save();
      } else {
        return null;
      }
    } else {
      result = result[0];
      console.log("Balance.findOneAndUpdate result", result)
      console.log("Balance.findOneAndUpdate updateData", updateData)
      // Object.assign(result, updateData);
      result.tokenCredits += updateData['$ADD'].tokenCredits;
      console.log("Balance.findOneAndUpdate result", result)
      result = await result.save();

    }

    return returnNew ? result : result;
  } catch (error) {
    throw new Error(`Failed to find or update balance: ${error.message}`);
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
  console.log("tokenCredits 1")
  const { tokenCredits: balance } = (await Balance.findOne({ user }, 'tokenCredits')) ?? {};
  console.log("tokenCredits 2")
  console.log("tokenCredits 2", balance)
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
