const dynamoose = require('dynamoose');
const { conversationPreset } = require('./defaults');
const presetSchema = new dynamoose.Schema(
  {
    presetId: {
      type: String,
      unique: true,
      required: true,
      hashkey: true,
    },
    title: {
      type: String,
      default: 'New Chat',
      meiliIndex: true,
    },
    user: {
      type: String,
      default: null,
      rangeKey: true
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
   {
      "timestamps": {
        "createdAt": {
            "createdAt": {
                "type": {
                    "value": Date,
                    "settings": {
                        "storage": "iso"
                    }
                }
            }
        },
        "updatedAt": {
                "updatedAt": {
                    "type": {
                        "value": Date,
                        "settings": {
                            "storage": "iso"
                        }
                    }
                }
            }
      }
    }
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

Preset.findOneAndUpdate = async function findOneAndUpdate(presetId, user, setter, options = {}) {
    try {
      // Perform the update operation
      const result = await Preset.update(
        { presetId, user },  // Query parameters
        setter,              // Update data
        {
          returnValues: options.new ? 'ALL_NEW' : 'NONE',  // Return the updated item if 'new' option is true
          upsert: options.upsert || false,  // Upsert behavior
        }
      );

      return result;
    } catch (error) {
      console.error('Error updating preset:', error);
      throw new Error(`Failed to update preset: ${error.message}`);
    }
}

module.exports = Preset;
