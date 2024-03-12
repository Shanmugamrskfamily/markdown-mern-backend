const mongoose = require("mongoose");
require('dotenv').config();
exports.db = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to the database');
  } catch (error) {
    console.error('Database connection error:', error);
  }
};