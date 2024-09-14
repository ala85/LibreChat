const { logger } = require('~/config');

const EventEmitter = require('events');
const { DynamoDB } = require('aws-sdk');
const Promise = require('bluebird');

/**
 * @var {number}
 *   Number of concurrent requests when clearing DynamoDB.
 */
const clearConcurrency = 100;

/**
 * DynamoDB store for the keyv project.
 */
class KeyvDynamoDb extends EventEmitter                         {




  /**
   * Constructs a KeyvDynamoDb object.
   *
   * @param {Object} opts
   *   KeyvDynamoDb options.
   */
  constructor(opts                     ) {
    super();
    this.dynamo = new DynamoDB(opts.clientOptions);
    this.tableName = opts.tableName || '';
    this.needsInit = true;
    this.tableExists(this.tableName)
      .then(isCreated => {
        if (isCreated) {
          this.needsInit = false;
          this.emit('isInitialized');
          return;
        }
        throw new Error(`MISSING_TABLE: The DynamoDB table ${this.tableName} does not exist.`);
      })
      .catch(error => {
        this.emit('error', error);
      });
  }

  /**
   * @inheritDoc
   */
  set(key        , value     , ttl         )                {
    try {
      this.checkIfInitializationIsNeeded();
    }
    catch (error) {
      return Promise.reject(error);
    }
    // Calculate the record expiration.
    const params               = {
      Item: {
        Cid: DynamoDB.Converter.input(key),
        CacheData: DynamoDB.Converter.input(value),
      },
      TableName: this.tableName,
    };
    if (ttl) {
      const exp         = parseInt(Date.now() / 1000, 10) + ttl;
      params.Item.Expiration = DynamoDB.Converter.input(exp);
    }
    return Promise.resolve()
      .then(() => this.dynamo.putItem(params).promise())
      .then(() => {})
      .catch(this.handleError.bind(this));
  }

  /**
   * @inheritDoc
   */
  get(key        )               {
    try {
      this.checkIfInitializationIsNeeded();
    }
    catch (error) {
      return Promise.reject(error);
    }
    // Query for the data.
    const params               = {
      TableName: this.tableName,
      Key: { Cid: DynamoDB.Converter.input(key) },
    };
    return Promise.resolve()
      .then(() => this.dynamo.getItem(params).promise())
      // Check if the record is expired.
      .then(res => this.deleteIfExpired(res, key))
      .then((res                ) => res
        ? this.extractOutputProperty(res, 'CacheData')
        : res
      )
      .catch(this.handleError.bind(this));
  }

  /**
   * @inheritDoc
   */
  delete(key        )                {
    try {
      this.checkIfInitializationIsNeeded();
    }
    catch (error) {
      return Promise.reject(error);
    }
    const params                  = {
      Key: { Cid: DynamoDB.Converter.input(key) },
      TableName: this.tableName,
    };
    return Promise.resolve()
      .then(() => this.dynamo.deleteItem(params).promise())
      .then(() => {})
      .catch(this.handleError.bind(this));
  }


  /**
   * @inheritDoc
   */
  clear()                {
    try {
      this.checkIfInitializationIsNeeded();
    }
    catch (error) {
      return Promise.reject(error);
    }
    const params            = {
      TableName: this.tableName,
    };
    return Promise.resolve()
      .then(() => this.dynamo.scan(params).promise())
      .then((res            ) => this.extractOutputProperties(res, 'Cid'))
      .then((ids               ) => {
        const deleteRequests                       = ids.map(id => ({
          DeleteRequest: { Key: { Cid: DynamoDB.Converter.input(id) } },
        }));
        // Batch writing only supports 25 deletions at a time in DynamoDB.
        const batches = this.chunkArray(deleteRequests, 25);
        return Promise.map(
          batches,
          (batch => {
            const requestItems                      = {
              RequestItems: {
                [this.tableName]: batch,
              }
            };
            return this.dynamo.batchWriteItem(requestItems).promise();
          }),
          { concurrency: clearConcurrency }
        );
      })
      .then(() => {})
      .catch(this.handleError.bind(this));
  }

  /**
   * Check if initialization is done.
   *
   * @throws {Error}
   *   When the key-value store is used before initialization.
   *
   * @protected
   */
  checkIfInitializationIsNeeded() {
    if (this.needsInit) {
      throw new Error('The table does not exist in DynamoDB');
    }
  }

  /**
   * Checks if a table with a given name exists.
   *
   * @param {string} tableName
   *   Then name of the table in DynamoDB.
   *
   * @return {Promise<boolean>}
   *   TRUE if it exists. FALSE otherwise.
   *
   * @protected
   */
  tableExists(tableName        )                   {
    return Promise.resolve()
      .then(() => this.dynamo.describeTable({ TableName: tableName }).promise())
      .then(() => true)
      .catch(this.handleError.bind(this))
      .catch(() => false);
  }

  /**
   * Extracts a property from the first record.
   *
   * @param {QueryOutput} output
   *   The output of a query operation.
   * @param {string} property
   *   The name of the property to extract.
   *
   * @returns {any}
   *   The value for that property.
   *
   * @protected
   */
  extractOutputProperty(output               , property        )      {
    if (typeof output.Item === 'undefined') {
      return undefined;
    }
    return DynamoDB.Converter.output(output.Item[property]);
  }

  /**
   * Extracts all properties from the record.
   *
   * @param {QueryOutput} output
   *   The output of a query operation.
   * @param {string} property
   *   The name of the property to extract.
   *
   * @returns {any}
   *   The value for that property.
   *
   * @protected
   */
  extractOutputProperties(output                           , property        )             {
    return output.Items.map(item => DynamoDB.Converter.output(
      item[property]
    ));
  }

  /**
   * Schedules a deletion if the record is expired.
   *
   * @param {GetItemOutput} res
   *   The result of the query.
   * @param {string} key
   *   The key of the record to delete.
   *
   * @returns {GetItemOutput|undefined}
   *   The same output if not expired. Undefined otherwise.
   *
   * @protected
   */
  deleteIfExpired(res               , key        )                 {
    const exp = parseInt(this.extractOutputProperty(res, 'Expiration'), 10);
    if (exp * 1000 < Date.now()) {
      // Schedule the item deletion when the record is expired.
      process.nextTick(() => this.delete(key));
      return undefined;
    }
    return res;
  }

  /**
   * Chunk an array into smaller arrays.
   *
   * @param {Array} array
   *   The array to chunk.
   * @param {number} chunkSize
   *   The number of items per chunk.
   *
   * @returns {Array[]}
   *   The array of chunks.
   *
   * @protected
   */
  chunkArray(array          , chunkSize        )                  {
    let i;
    let j;
    const output = [];
    for (i = 0, j = array.length; i<j; i += chunkSize) {
      output.push(array.slice(i, i + chunkSize));
    }
    return output;
  }

  /**
   * Handles a rejected promise by emitting an error and re-throwing it.
   *
   * @param {*} error
   *   The error.
   *
   * @returns {boolean}
   */
  handleError(error   )       {
    this.emit('error', error);
    throw error;
  }
}


// const KeyvDynamoDb = require('@keyv/dynamodb');

const keyvDynamoDb = new KeyvDynamoDb({
    tableName: 'KeyvStore',
    clientOptions: {
        // Any options here will be passed to the DynamoDB client.
        region: 'eu-central-1',
    },
});

keyvDynamoDb.on('error', (err) => logger.error('KeyvDynamoDb connection error:', err));

logger.info('DynamoDB initialized.');

module.exports = keyvDynamoDb;
