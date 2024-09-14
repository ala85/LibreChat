const dynamoose = require('dynamoose');

const conversationTagSchema = new dynamoose.Schema(
  {
    tag: {
      type: String,
      index: true,
    },
    user: {
      type: String,
      index: true,
    },
    description: {
      type: String,
      index: true,
    },
    count: {
      type: Number,
      default: 0,
    },
    position: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

//conversationTagSchema.index({ tag: 1, user: 1 }, { unique: true });

const ConversationTag = dynamoose.model('ConversationTag', conversationTagSchema);

ConversationTag.find = async function (query) {
  try {
    const count = await ConversationTag.query(query).count().exec();
    return count;
  } catch (error) {
    throw new Error(`Failed to count conversation tags: ${error.message}`);
  }
};

module.exports = ConversationTag;
