const mongoose = require('mongoose');

const markdownSchema = new mongoose.Schema({
  content: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Markdown = mongoose.model('Markdown', markdownSchema);

module.exports = Markdown;
