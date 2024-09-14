const dynamoose = require('dynamoose');

const keySchema = new dynamoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    expires: 0,
  },
});

// keySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = keySchema;
