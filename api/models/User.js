const dynamoose = require('dynamoose');
const userSchema = require('~/models/schema/userSchema');

const User = dynamoose.model('User', userSchema);

User.findOne = async function (query) {
  try {
    const user = await User.query(query).exec();
    return user[0] || null;
  } catch (error) {
    throw new Error(`Failed to find user: ${error.message}`);
  }
};

User.findById = async function (userId) {
  try {
    const user = await User.query({_id: userId}).exec();
    return user[0] || null;
  } catch (error) {
    throw new Error(`Failed to find user: ${error.message}`);
  }
};

User.countDocuments = async function (query) {
  try {
    const count = await User.scan(query).count().exec();
    return count;
  } catch (error) {
    throw new Error(`Failed to count users: ${error.message}`);
  }
};


module.exports = User;
