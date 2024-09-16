const dynamoose = require('dynamoose');
const { Constants } = require('librechat-data-provider');
const Schema = dynamoose.Schema;

/**
 * @typedef {Object} MongoPromptGroup
 * @property {ObjectId} [_id] - MongoDB Document ID
 * @property {string} name - The name of the prompt group
 * @property {ObjectId} author - The author of the prompt group
 * @property {ObjectId} [projectId=null] - The project ID of the prompt group
 * @property {ObjectId} [productionId=null] - The project ID of the prompt group
 * @property {string} authorName - The name of the author of the prompt group
 * @property {number} [numberOfGenerations=0] - Number of generations the prompt group has
 * @property {string} [oneliner=''] - Oneliner description of the prompt group
 * @property {string} [category=''] - Category of the prompt group
 * @property {string} [command] - Command for the prompt group
 * @property {Date} [createdAt] - Date when the prompt group was created (added by timestamps)
 * @property {Date} [updatedAt] - Date when the prompt group was last updated (added by timestamps)
 */

const promptGroupSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    numberOfGenerations: {
      type: Number,
      default: 0,
    },
    oneliner: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: '',
      index: true,
    },
    projectIds: {
      type: [String],
      index: true,
    },
    productionId: {
      type: String,
      required: true,
      index: true,
    },
    author: {
      type: String,
      required: true,
      index: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    command: {
      type: String,
      index: true,
      validate: {
        validator: function (v) {
          return v === undefined || v === null || v === '' || /^[a-z0-9-]+$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid command. Only lowercase alphanumeric characters and highfins (') are allowed.`,
      },
      maxlength: [
        Constants.COMMANDS_MAX_LENGTH,
        `Command cannot be longer than ${Constants.COMMANDS_MAX_LENGTH} characters`,
      ],
    },
  },
  {
    timestamps: true,
  },
);

const PromptGroup = dynamoose.model('PromptGroup', promptGroupSchema);

PromptGroup.aggregate = async (pipeline) => {
  try {
    let results = await Prompt.scan().exec(); // Retrieve all items

    // Apply the pipeline stages
    for (const stage of pipeline) {
      if (stage.$match) {
        // Match stage
        results = results.filter(item => {
          return Object.keys(stage.$match).every(key => item[key] === stage.$match[key]);
        });
      }

      if (stage.$sort) {
        // Sort stage
        const [field, order] = Object.entries(stage.$sort)[0];
        results.sort((a, b) => (a[field] > b[field] ? order : -order));
      }

      if (stage.$lookup) {
        // Lookup stage
        const { from, localField, foreignField, as } = stage.$lookup;

        if (from === 'prompts') {
            singular = 'Prompt';
        }
        const lookupTable = await dynamoose.model(singular).scan().exec(); // Retrieve all items from the lookup table

        results = results.map(item => {
          const foreignItems = lookupTable.filter(lookupItem => lookupItem[foreignField] === item[localField]);
          return { ...item, [as]: foreignItems };
        });
      }

      if (stage.$unwind) {
        // Unwind stage
        const { path, preserveNullAndEmptyArrays } = stage.$unwind;
        results = results.flatMap(item => {
          const array = item[path];
          if (!array || (array.length === 0 && !preserveNullAndEmptyArrays)) {
            return [];
          }
          return array.map(subItem => ({ ...item, [path]: subItem }));
        });
      }

      if (stage.$project) {
        // Project stage
        results = results.map(item => {
          const projected = {};
          for (const field of Object.keys(stage.$project)) {
            if (stage.$project[field] === 1) {
              projected[field] = item[field];
            }
          }
          return projected;
        });
      }
    }

    return results;
  } catch (error) {
    throw new Error(`Failed to process pipeline: ${error.message}`);
  }
};


const promptSchema = new Schema(
  {
    groupId: {
      type: String,
      required: true,
      index: true,
    },
    author: {
      type: String,
      required: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'chat'],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Prompt = dynamoose.model('Prompt', promptSchema);

//promptSchema.index({ createdAt: 1, updatedAt: 1 });
//promptGroupSchema.index({ createdAt: 1, updatedAt: 1 });

Prompt.aggregate = async (pipeline) => {
  try {
    let results = await PromptGroup.scan().exec(); // Retrieve all items

    // Apply the pipeline stages
    for (const stage of pipeline) {
      if (stage.$match) {
        // Match stage
        results = results.filter(item => {
          return Object.keys(stage.$match).every(key => item[key] === stage.$match[key]);
        });
      }

      if (stage.$sort) {
        // Sort stage
        const [field, order] = Object.entries(stage.$sort)[0];
        results.sort((a, b) => (a[field] > b[field] ? order : -order));
      }

      if (stage.$lookup) {
        // Lookup stage
        const { from, localField, foreignField, as } = stage.$lookup;
        const lookupTable = await dynamoose.model(from).scan().exec(); // Retrieve all items from the lookup table

        results = results.map(item => {
          const foreignItems = lookupTable.filter(lookupItem => lookupItem[foreignField] === item[localField]);
          return { ...item, [as]: foreignItems };
        });
      }

      if (stage.$unwind) {
        // Unwind stage
        const { path, preserveNullAndEmptyArrays } = stage.$unwind;
        results = results.flatMap(item => {
          const array = item[path];
          if (!array || (array.length === 0 && !preserveNullAndEmptyArrays)) {
            return [];
          }
          return array.map(subItem => ({ ...item, [path]: subItem }));
        });
      }

      if (stage.$project) {
        // Project stage
        results = results.map(item => {
          const projected = {};
          for (const field of Object.keys(stage.$project)) {
            if (stage.$project[field] === 1) {
              projected[field] = item[field];
            }
          }
          return projected;
        });
      }
    }

    return results;
  } catch (error) {
    throw new Error(`Failed to process pipeline: ${error.message}`);
  }
};


module.exports = { Prompt, PromptGroup };
