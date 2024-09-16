const dynamoose = require('dynamoose');
const { v4: uuidv4 } = require('uuid');

const messageSchema = new dynamoose.Schema(
  {
    messageId: {
      type: String,
      unique: true,
      required: true,
      index: true,
      meiliIndex: true,
      hashKey: true
    },
    conversationId: {
      type: String,
      index: true,
      required: true,
      meiliIndex: true,
    },
    user: {
      type: String,
      index: true,
      required: true,
      default: null,
    },
    model: {
      type: String,
      default: null,
    },
    endpoint: {
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
    parentMessageId: {
      type: String,
    },
    tokenCount: {
      type: Number,
    },
    summaryTokenCount: {
      type: Number,
    },
    sender: {
      type: String,
      meiliIndex: true,
    },
    text: {
      type: String,
      meiliIndex: true,
    },
    summary: {
      type: String,
    },
    isCreatedByUser: {
      type: Boolean,
      required: true,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    unfinished: {
      type: Boolean,
      default: false,
    },
    error: {
      type: Boolean,
      default: false,
    },
    finish_reason: {
      type: String,
    },
    _meiliIndex: {
      type: Boolean,
      required: false,
      select: false,
      default: false,
    },
    //FIXME
    files: { type: [{ type: String }], default: undefined },
    plugin: {
        type: Object,
        schema: {
          type: {
            type: Object,
            schema: {
              latest: {
                type: String,
                required: false, // Not required
              },
              inputs: {
                type: Array, // Array of mixed types
                schema: [dynamoose.type.ANY], // Use ANY for mixed types
                required: false, // Not required
                default: undefined, // Optional, default value
              },
              outputs: {
                type: String, // String type
                required: false, // Not required
              },
            },
          },
          default: {
            type: String, // Assuming default is a string; adjust type if needed
            default: undefined, // Default value
          },
        },
      },
    //FIXME
    plugins: { type: [{ type: String }], default: undefined },
    content: {
       type: [{ type: dynamoose.type.ANY }], // Use List for arrays
       schema: [dynamoose.type.ANY], // Mixed type equivalent
       default: undefined,
    },
    thread_id: {
      type: String,
    },
    /* frontend components */
    iconURL: {
      type: String,
    },
  },
  { timestamps: true },
);

//messageSchema.index({ createdAt: 1 });
//messageSchema.index({ messageId: 1, user: 1 }, { unique: true });

/** @type {dynamoose.Model<TMessage>} */
const Message = dynamoose.model('Message', messageSchema);

Message.find = async function (query) {
  try {
    const message = await Message.query(query).exec();
    return message[0] || null;
  } catch (error) {
    throw new Error(`Failed to find message: ${error.message}`);
  }
};

Message.findOneAndUpdate = async function (searchCriteria, updateData, options = {}) {
  const { upsert = false, new: returnNew = false } = options;

  //console.log("findOneAndUpdate.searchCriteria", searchCriteria)
  //console.log("findOneAndUpdate.updateData", updateData)
  //console.log("findOneAndUpdate.options", options)
  try {
    let result = await Message.query(searchCriteria).exec();

    if (result.length === 0) {
      if (upsert) {
        result = await new Message(updateData).save();
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
    throw new Error(`Failed to find or update message: ${error.message}`);
  }
};

Message.deleteMany = async (filter) => {

  try {
    const {user, conversationIds} = filter;

    let messages = null;
    console.log(filter)
    if (conversationIds) {
        // Scan for all messages with the specified conversation IDs
        messages = await Message.scan('conversationId')
        .using("conversationIdGlobalIndex")
        .in(conversationIds)
        .exec();

    } else if (user) {
        messages = await Message.query('user')
         .eq(user)
         .using('userGlobalIndex') // Specify the index to use
         .exec();
    }

    if (!messages || !messages.length) {
        console.log("No messages to delete")
        return 0;
    }

    console.log("Something to delete!!!!")
    // Delete all messages matching the conversation IDs
    const deletePromises = messages.map(message =>
      message.delete({ id: message.id })
    );

    await Promise.all(deletePromises);
    console.log("Deleted messages: ", deletePromises.length)
    return deletePromises.length;


    return deletePromises.length; // Return the count of deleted messages
  } catch (error) {
    throw new Error(`Failed to delete messages: ${error.message}`);
  }
};

module.exports = Message;
