// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    flatNumber: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    isApproved: { type: Boolean, default: false } // ✅ Approval Status
});

module.exports = mongoose.model('User', UserSchema);
