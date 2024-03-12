const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true, // This field is still required
  },
  password: {
    type: String,
    // minlength: 6, // Password is no longer required
  },
  email: {
    type: String,
    // unique: true, // Email is no longer unique
  },
  mobile: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
        return /^\d{10}$/.test(value);
      },
      message: 'Mobile number must be 10 digits long.',
    },
  },
  isEmailVerified: {
    type: Boolean,
    default: false
},
verificationToken: String,
resetPasswordToken: String,
resetPasswordExpires: Date
});

const User = mongoose.model('User', userSchema);

module.exports = User;
