const { PermissionTypes, Permissions } = require('librechat-data-provider');
const dynamoose = require('dynamoose');

const roleSchema = new dynamoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  /*[PermissionTypes.BOOKMARKS]: {
    [Permissions.USE]: {
      type: Boolean,
      default: true,
    },
  },*/
  [PermissionTypes.BOOKMARKS]: {
      type: Object,  // Since Dynamoose doesn't support nested schema directly, use Object type
      schema: {
        [Permissions.USE]: {
          type: Boolean,
          default: true,
        },
      },
    },
    /*
  [PermissionTypes.PROMPTS]: {
    [Permissions.SHARED_GLOBAL]: {
      type: Boolean,
      default: false,
    },
    [Permissions.USE]: {
      type: Boolean,
      default: true,
    },
    [Permissions.CREATE]: {
      type: Boolean,
      default: true,
    },
  },*/
  [PermissionTypes.PROMPTS]: {
      type: Object,
      schema: {
        [Permissions.SHARED_GLOBAL]: {
          type: Boolean,
          default: false,
        },
        [Permissions.USE]: {
          type: Boolean,
          default: true,
        },
        [Permissions.CREATE]: {
          type: Boolean,
          default: true,
        },
      },
    },
  [PermissionTypes.AGENTS]: {
      type: Object,
      schema: {
        [Permissions.SHARED_GLOBAL]: {
          type: Boolean,
          default: false,
        },
        [Permissions.USE]: {
          type: Boolean,
          default: true,
        },
        [Permissions.CREATE]: {
          type: Boolean,
          default: true,
        },
      },
    },
  [PermissionTypes.MULTI_CONVO]: {
    type: Object,
    schema: {
        [Permissions.USE]: {
              type: Boolean,
              default: true,
            }
    }
  },
});

const Role = dynamoose.model('Role', roleSchema);

module.exports = Role;
