const dynamoose = require('dynamoose');

const assistantSchema = new dynamoose.Schema(
  {
    user: {
      type: String,
      required: true,
    },
    assistant_id: {
      type: String,
      index: true,
      required: true,
    },
    /*
    avatar: {
      type: {
        filepath: String,
        source: String,
      },
      default: undefined,
    },
    */
    avatar: {
        type: Object,
        schema: {
          filepath: {
            type: String,
          },
          source: {
            type: String,
          },
        },
        default: undefined,
      },
    conversation_starters: {
      type: [String],
      default: [],
    },
    access_level: {
      type: Number,
    },
    file_ids: { type: [String], default: undefined },
    actions: { type: [String], default: undefined },
  },
  {
    timestamps: true,
  },
);

module.exports = assistantSchema;
