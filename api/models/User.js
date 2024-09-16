const dynamoose = require('dynamoose');
const userSchema = require('~/models/schema/userSchema');

const User = dynamoose.model('User', userSchema);

User.findOne = async function (query) {
  try {

    const queryBuilder = User.scan(); // Initialize the scan operation

    const orConditions = [];
    const andConditions = [];

    // Iterate over each field in the query object
    for (const [key, value] of Object.entries(query)) {
      if (Array.isArray(value)) {
        // Add 'or' condition for fields with an array of values
        orConditions.push({ [key]: { in: value } });
      } else {
        // Add 'and' condition for fields with a single value
        andConditions.push({ [key]: value });
      }
    }

    // Apply 'and' conditions
    andConditions.forEach(condition => {
      for (const [field, val] of Object.entries(condition)) {
        queryBuilder.where(field).eq(val);
      }
    });

    // Apply 'or' conditions if any
    if (orConditions.length > 0) {
      queryBuilder.or();
      orConditions.forEach(condition => {
        for (const [field, val] of Object.entries(condition)) {
          queryBuilder.where(field).in(val.in);
        }
      });
    }

    const users = await queryBuilder.exec(); // Execute the query
    return users[0] || null; // Return the first user or null if none found

  } catch (error) {
    throw new Error(`Failed to find user: ${error.message}`);
  }
};

User.findByIdAndUpdate = async function (id, updates, options = {}) {
  try {
    const updatedUser = await User.update({ id }, updates, {
      return: options.new ? 'UPDATED_NEW' : 'NONE',
    });

    return updatedUser || null;
  } catch (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }
};

User.deleteOne = async function (id) {
  try {
    const result = await User.delete({ _id: id });
    return result;
  } catch (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
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
