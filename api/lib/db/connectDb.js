require('dotenv').config();
const dynamoose = require('dynamoose');

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.dynamoose;

if (!cached) {
  cached = global.dynamoose = { conn: null, promise: null };
}

async function connectDb() {
  if (cached.conn && cached.conn?._readyState === 1) {
    return cached.conn;
  }

  const disconnected = cached.conn && cached.conn?._readyState !== 1;
  if (!cached.promise || disconnected) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      bufferCommands: false,
      // bufferMaxEntries: 0,
      // useFindAndModify: true,
      // useCreateIndex: true
    };

    const ddb = new dynamoose.aws.ddb.DynamoDB({
        "credentials": {
            "accessKeyId": process.env.AWS_ACCESS_KEY_ID,
            "secretAccessKey": process.env.AWS_SECRET_ACCESS_KEY
        },
        "region": process.env.AWS_DEFAULT_REGION
    });

    cached.promise = new Promise((resolve) => {
        // Resolves with the DynamoDB instance currently set in Dynamoose
        resolve(ddb);
    })
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDb;
