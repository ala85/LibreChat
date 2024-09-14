const dynamoose = require('dynamoose');

const shareSchema = new dynamoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      index: true,
    },
    user: {
      type: String,
      index: true,
    },
    messages: [{ type: String }],
    shareId: {
      type: String,
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    isVisible: {
      type: Boolean,
      default: false,
    },
    isAnonymous: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = dynamoose.model('SharedLink', shareSchema);
