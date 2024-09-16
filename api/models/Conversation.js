const Conversation = require('./schema/convoSchema');
const { getMessages, deleteMessages } = require('./Message');
const logger = require('~/config/winston');

const isEmpty = (obj) => {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
};

/**
 * Searches for a conversation by conversationId and returns a lean document with only conversationId and user.
 * @param {string} conversationId - The conversation's ID.
 * @returns {Promise<{conversationId: string, user: string} | null>} The conversation object with selected fields or null if not found.
 */
const searchConversation = async (conversationId) => {
  try {
    return await Conversation.findOne({ conversationId }, 'conversationId user');
  } catch (error) {
    logger.error('[searchConversation] Error searching conversation', error);
    throw new Error('Error searching conversation');
  }
};

/**
 * Retrieves a single conversation for a given user and conversation ID.
 * @param {string} user - The user's ID.
 * @param {string} conversationId - The conversation's ID.
 * @returns {Promise<TConversation>} The conversation object.
 */
const getConvo = async (user, conversationId) => {
  try {
    return await Conversation.findOne({ user, conversationId });
  } catch (error) {
    logger.error('[getConvo] Error getting single conversation', error);
    return { message: 'Error getting single conversation' };
  }
};

module.exports = {
  Conversation,
  searchConversation,
  /**
   * Saves a conversation to the database.
   * @param {Object} req - The request object.
   * @param {string} conversationId - The conversation's ID.
   * @param {Object} metadata - Additional metadata to log for operation.
   * @returns {Promise<TConversation>} The conversation object.
   */
  saveConvo: async (req, { conversationId, newConversationId, ...convo }, metadata) => {
    try {
        console.log("saveConvo1")
      if (metadata && metadata?.context) {
        logger.debug(`[saveConvo] ${metadata.context}`);
      }
      console.log("saveConvo2")
      const messages = await getMessages({ conversationId }, ['messageId', 'endpoint']);
         console.log("saveConvo3")
      console.log("saveConvo.conversationId", conversationId)
      console.log("saveConvo.messages", messages)

      const filteredMessages = messages.map(message => message.messageId);

console.log("saveConvo.filteredMessages", filteredMessages)


      const update = { ...convo, messages: filteredMessages, user: req.user.id };
      if (newConversationId) {
        update.conversationId = newConversationId;
      }

      if (messages && messages.length) {
        update.endpoint = messages[0].endpoint;
      }
console.log("saveConvoxxxxxxxxxxx")

      const conversation = await Conversation.findOneAndUpdate(
        { conversationId, user: req.user.id },
        update,
        {
          new: true,
          upsert: true,
        },
      );

      console.log("saveConvoyyyyyyyyyyyx")
      console.log("saveConvo.conversation", conversation)
      return conversation;
    } catch (error) {
      logger.error('[saveConvo] Error saving conversation', error);
      if (metadata && metadata?.context) {
        logger.info(`[saveConvo] ${metadata.context}`);
      }
      return { message: 'Error saving conversation' };
    }
  },
  bulkSaveConvos: async (conversations) => {
    try {
      const bulkOps = conversations.map((convo) => ({
        updateOne: {
          filter: { conversationId: convo.conversationId, user: convo.user },
          update: convo,
          upsert: true,
          timestamps: false,
        },
      }));

      const result = await Conversation.bulkWrite(bulkOps);
      return result;
    } catch (error) {
      logger.error('[saveBulkConversations] Error saving conversations in bulk', error);
      throw new Error('Failed to save conversations in bulk.');
    }
  },
  getConvosByPage: async (user, pageNumber = 1, pageSize = 25, isArchived = false, tags) => {
    const query = { user };
    /*if (isArchived) {
      query.isArchived = true;
    } else {
      query.$or = [{ isArchived: false }, { isArchived: { $exists: false } }];
    }*/
    if (Array.isArray(tags) && tags.length > 0) {
      query.tags = { $in: tags };
    }
    try {
      logger.debug("getConvosByPage 1")
      const totalConvos = (await Conversation.countDocuments(query)) || 1;
      logger.debug("getConvosByPage 2")
      const totalPages = Math.ceil(totalConvos / pageSize);
      logger.debug("getConvosByPage 3")

      const convos = await Conversation.query(query)   // Query based on the partition key
        .sort('descending')   // Sort descending based on the range key
        .limit(pageSize)      // Limit the number of results
        .exec();

      console.log("getConvosByPage 4")
      return { conversations: convos, pages: totalPages, pageNumber, pageSize };
    } catch (error) {
      logger.error('[getConvosByPage] Error getting conversations', error);
      return { message: 'Error getting conversations alalalal' };
    }
  },
  getConvosQueried: async (user, convoIds, pageNumber = 1, pageSize = 25) => {
    try {
      if (!convoIds || convoIds.length === 0) {
        return { conversations: [], pages: 1, pageNumber, pageSize };
      }

      const cache = {};
      const convoMap = {};
      const promises = [];

      convoIds.forEach((convo) =>
        promises.push(
          Conversation.findOne({
            user,
            conversationId: convo.conversationId,
          }).lean(),
        ),
      );

      const results = (await Promise.all(promises)).filter(Boolean);

      results.forEach((convo, i) => {
        const page = Math.floor(i / pageSize) + 1;
        if (!cache[page]) {
          cache[page] = [];
        }
        cache[page].push(convo);
        convoMap[convo.conversationId] = convo;
      });

      const totalPages = Math.ceil(results.length / pageSize);
      cache.pages = totalPages;
      cache.pageSize = pageSize;
      return {
        cache,
        conversations: cache[pageNumber] || [],
        pages: totalPages || 1,
        pageNumber,
        pageSize,
        convoMap,
      };
    } catch (error) {
      logger.error('[getConvosQueried] Error getting conversations', error);
      return { message: 'Error fetching conversations' };
    }
  },
  getConvo,
  /* chore: this method is not properly error handled */
  getConvoTitle: async (user, conversationId) => {
    try {
      const convo = await getConvo(user, conversationId);
      /* ChatGPT Browser was triggering error here due to convo being saved later */
      if (convo && !convo.title) {
        return null;
      } else {
        // TypeError: Cannot read properties of null (reading 'title')
        return convo?.title || 'New Chat';
      }
    } catch (error) {
      logger.error('[getConvoTitle] Error getting conversation title', error);
      return { message: 'Error getting conversation title' };
    }
  },
  /**
   * Asynchronously deletes conversations and associated messages for a given user and filter.
   *
   * @async
   * @function
   * @param {string|ObjectId} user - The user's ID.
   * @param {Object} filter - Additional filter criteria for the conversations to be deleted.
   * @returns {Promise<{ n: number, ok: number, deletedCount: number, messages: { n: number, ok: number, deletedCount: number } }>}
   *          An object containing the count of deleted conversations and associated messages.
   * @throws {Error} Throws an error if there's an issue with the database operations.
   *
   * @example
   * const user = 'someUserId';
   * const filter = { someField: 'someValue' };
   * const result = await deleteConvos(user, filter);
   * logger.error(result); // { n: 5, ok: 1, deletedCount: 5, messages: { n: 10, ok: 1, deletedCount: 10 } }
   */
  deleteConvos: async (user, filter) => {
    console.log("1", filter)
    let deleteCountMessages = 0;
    let queryBuilder = await Conversation.scan('user')
                     .eq(user)
                     .using('userGlobalIndex');

    if (!filter || isEmpty(filter)) {
        console.log("2")
        const items = queryBuilder.exec();
        const deletePromises = items.map(item =>
          item.delete({ conversationId: item.id })
        );

        await Promise.all(deletePromises);
        deleteCountMessages = await deleteMessages({ user });
    } else {
    console.log("3")
        queryBuilder = queryBuilder
        .where ('conversationId')
        .eq(filter.conversationId)

        const conv = await queryBuilder.exec();

        if (conv && conv[0]) {
             console.log("3", conv[0])
             await conv[0].delete({ conversationId: filter.conversationId })
        }

        console.log("4")
        deleteCountMessages = await deleteMessages({ conversationIds: [filter.conversationId] });
    }



    console.log("5")
    return deleteCountMessages;
  },
};
