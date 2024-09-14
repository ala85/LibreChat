const dynamoose = require('dynamoose');

const pluginAuthSchema = new dynamoose.Schema(
  {
    authField: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    pluginKey: {
      type: String,
    },
  },
  { timestamps: true },
);

const PluginAuth = dynamoose.model('PluginAuth', pluginAuthSchema);

module.exports = PluginAuth;
