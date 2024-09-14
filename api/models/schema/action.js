const dynamoose = require('dynamoose');

const { Schema } = dynamoose;

const AuthSchema = new Schema(
  {
    authorization_type: String,
    custom_auth_header: String,
    type: {
      type: String,
      enum: ['service_http', 'oauth', 'none'],
    },
    authorization_content_type: String,
    authorization_url: String,
    client_url: String,
    scope: String,
    token_exchange_method: {
      type: String,
      enum: ['default_post', 'basic_auth_header', null],
    },
  },
  { _id: false },
);

const actionSchema = new Schema({
  user: {
    type: String,
    index: true,
    required: true,
  },
  action_id: {
    type: String,
    index: true,
    required: true,
  },
  type: {
    type: String,
    default: 'action_prototype',
  },
  settings: dynamoose.type.ANY,
  agent_id: String,
  assistant_id: String,
  /*
  metadata: {
    api_key: String, // private, encrypted
    auth: AuthSchema,
    domain: {
      type: String,
      required: true,
    },
    // json_schema: Schema.Types.Mixed,
    privacy_policy_url: String,
    raw_spec: String,
    oauth_client_id: String, // private, encrypted
    oauth_client_secret: String, // private, encrypted
  },
  */
  api_key: {
      type: String,  // private, encrypted
    },
    auth: {
      type: Object,  // Use Object for nested schemas
      schema: AuthSchema,
    },
    domain: {
      type: String,
      required: true,
    },
    privacy_policy_url: {
      type: String,
    },
    raw_spec: {
      type: String,
    },
    oauth_client_id: {
      type: String,  // private, encrypted
    },
    oauth_client_secret: {
      type: String,  // private, encrypted
    }
});
// }, { minimize: false }); // Prevent removal of empty objects

module.exports = actionSchema;
