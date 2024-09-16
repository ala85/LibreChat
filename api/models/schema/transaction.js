const dynamoose = require('dynamoose');

const transactionSchema = new dynamoose.Schema(
  {
    user: {
      type: String,
      index: true,
      required: true,
    },
    conversationId: {
      type: String,
      index: true,
    },
    tokenType: {
      type: String,
      enum: ['prompt', 'completion', 'credits'],
      required: true,
    },
    model: {
      type: String,
    },
    context: {
      type: String,
    },
    valueKey: {
      type: String,
    },
    rate: Number,
    rawAmount: Number,
    tokenValue: Number,
    inputTokens: { type: Number },
    writeTokens: { type: Number },
    readTokens: { type: Number },
  },
  {
    timestamps: true,
  },
);

module.exports = transactionSchema;
