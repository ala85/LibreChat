const { Schema } = require('dynamoose');
const { v4: uuidv4 } = require('uuid'); // For generating unique IDs

/**
 * @typedef {Object} MongoProject
 * @property {ObjectId} [_id] - MongoDB Document ID
 * @property {string} name - The name of the project
 * @property {ObjectId[]} promptGroupIds - Array of PromptGroup IDs associated with the project
 * @property {Date} [createdAt] - Date when the project was created (added by timestamps)
 * @property {Date} [updatedAt] - Date when the project was last updated (added by timestamps)
 */

const projectSchema = new Schema(
  {
     _id: {
        type: String,
        hashKey: true, // Primary key
        default: uuidv4, // Automatically generate a UUID
      },
    name: {
      type: String,
      required: true,
      index: true,
    },
    promptGroupIds: {
      type: Array,
      schema: [String],
      default: [],
    },
    agentIds: {
      type: Array,
      schema: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = projectSchema;
