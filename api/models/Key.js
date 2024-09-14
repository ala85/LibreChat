const dynamoose = require('dynamoose');
const keySchema = require('./schema/key');

const Key = dynamoose.model('Key', keySchema);


Key.findOne = async function (query) {
  try {
    const key = await Key.query(query).exec();
    return key[0] || null;
  } catch (error) {
    throw new Error(`Failed to find key: ${error.message}`);
  }
};

module.exports = Key;
