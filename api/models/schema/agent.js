const dynamoose = require('dynamoose');

const agentSchema = new dynamoose.Schema(
  {
    id: {
      type: String,
      index: true,
      required: true,
    },
    name: {
      type: String,
    },
    description: {
      type: String,
    },
    instructions: {
      type: String,
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
    provider: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    model_parameters: {
      type: Object,
    },
    access_level: {
      type: Number,
    },
    tools: {
      type: [String],
      default: undefined,
    },
    tool_kwargs: {
      type: [{ type: dynamoose.type.ANY }],
    },
    file_ids: {
      type: [String],
      default: undefined,
    },
    actions: {
      type: [String],
      default: undefined,
    },
    author: {
      type: String,
      required: true,
    },
    projectIds: {
      type: [String],
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = agentSchema;
