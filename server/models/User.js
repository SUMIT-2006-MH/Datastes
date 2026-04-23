const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: false, // Optional for Google Auth users
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
  googleId: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
