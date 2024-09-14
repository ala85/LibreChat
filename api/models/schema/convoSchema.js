const dynamoose = require('dynamoose');
const { conversationPreset } = require('./defaults');
const { v4: uuidv4 } = require('uuid'); // For generating unique IDs

const convoSchema = new dynamoose.Schema(
  {
    conversationId: {
      type: String,
      unique: true,
      required: true,
      index: true,
      meiliIndex: true,
      default: uuidv4
    },
    title: {
      type: String,
      default: 'New Chat',
      meiliIndex: true,
    },
    user: {
      type: String,
      index: true,
    },
    //messages: [{ type: dynamoose.Schema.Types.ObjectId, ref: 'Message' }],
    messages: {
      type: dynamoose.type.ANY,       // Declare as an array
      schema: dynamoose.type.ANY,  // Store message IDs as strings
    },
    // google only
    //examples: { type: [{ type: dynamoose.Schema.Types.Mixed }], default: undefined },
    examples: {
        type: Array,               // Define it as an array
        schema: [dynamoose.type.ANY],  // Each element in the array can be of any type
        default: undefined,        // Default value is undefined
      },
    //agentOptions: { type: dynamoose.Schema.Types.Mixed,},
    agentOptions: { type: dynamoose.type.ANY },
    ...conversationPreset,
    // for bingAI only
    bingConversationId: {
      type: String,
    },
    jailbreakConversationId: {
      type: String,
    },
    conversationSignature: {
      type: String,
    },
    clientId: {
      type: String,
    },
    invocationId: {
      type: Number,
    },
    tags: {
      type: Array,               // Define it as an array
      schema: [String],  // Each element in the array can be of any type
      default: [],
      meiliIndex: true,
    },
  },
  { timestamps: true },
);


//convoSchema.index({ createdAt: 1, updatedAt: 1 });
//convoSchema.index({ conversationId: 1, user: 1 }, { unique: true });

//const Conversation = dynamoose.models.Conversation || dynamoose.model('Conversation', convoSchema);
const Conversation = dynamoose.model('Conversation', convoSchema);

Conversation.findOne = async function (query) {
  try {
    const convo = await Conversation.query(query).exec();
    return convo[0] || null;
  } catch (error) {
    throw new Error(`Failed to find conversations: ${error.message}`);
  }
};

Conversation.findOneAndUpdate = async function (searchCriteria, updateData, options = {}) {
  const { upsert = false, new: returnNew = false } = options;

  console.log("findOneAndUpdate.searchCriteria", searchCriteria)
  console.log("findOneAndUpdate.updateData", updateData)
  console.log("findOneAndUpdate.options", options)
  try {
    let result = await Conversation.query(searchCriteria).exec();
    console.log("result", result)
    if (result.length === 0) {
      if (upsert) {
        result = await new Conversation(updateData).save();
      } else {
        return null;
      }
    } else {
      result = result[0];
      Object.assign(result, updateData);
      result = await result.save();
    }

    return returnNew ? result : result;
  } catch (error) {
    throw new Error(`Failed to find or update conversation: ${error.message}`);
  }
};


Conversation.countDocuments = async function (query) {
   console.log("sssssssssss", query)
  try {
    const count = await Conversation.query(query).count().exec();
    return count;
  } catch (error) {
    throw new Error(`Failed to count conversations: ${error.message}`);
  }
};

module.exports = Conversation;
