const dynamoose = require('dynamoose');
const { conversationPreset } = require('./defaults');
const presetSchema = new dynamoose.Schema(
  {
    presetId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Chat',
      meiliIndex: true,
    },
    user: {
      type: String,
      default: null,
      index: true
    },
    defaultPreset: {
      type: Boolean,
    },
    order: {
      type: Number,
    },
    // google only
    examples: [{ type: dynamoose.type.ANY }],
    ...conversationPreset,
    agentOptions: {
      type: dynamoose.type.ANY,
      default: null,
    },
  },
  { timestamps: true },
);

const Preset = dynamoose.model('Preset', presetSchema);

Preset.find = async function (query) {
  try {
   const preset = await Preset.query(query).exec();
   return preset[0] || null;
  } catch (error) {
   throw new Error(`Failed to find preset: ${error.message}`);
  }
};

module.exports = Preset;
