const dynamoose = require('dynamoose');

const bannerSchema = new dynamoose.Schema(
  {
    bannerId: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    displayFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },
    displayTo: {
      type: Date,
    },
    type: {
      type: String,
      enum: ['banner', 'popup'],
      default: 'banner',
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },

  { timestamps: true },
);

const Banner = dynamoose.model('Banner', bannerSchema);
module.exports = Banner;
