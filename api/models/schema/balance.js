const dynamoose = require('dynamoose');

const balanceSchema = new dynamoose.Schema({
  user: {
    type: String,
    index: true,
    required: true,
  },
  // 1000 tokenCredits = 1 mill ($0.001 USD)
  tokenCredits: {
    type: Number,
    default: 0,
  },
});

module.exports = balanceSchema;
