const dynamoose = require('dynamoose');
const Schema = dynamoose.Schema;

const categoriesSchema = new Schema({
  label: {
    type: String,
    required: true,
    unique: true,
  },
  value: {
    type: String,
    required: true,
    unique: true,
  },
});

const categories = dynamoose.model('categories', categoriesSchema);

module.exports = { Categories: categories };
