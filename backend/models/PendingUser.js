// models/PendingUser.js
const mongoose = require('mongoose');

const PendingUserSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    flatNumber: String,
    phoneNumber: String,
    requestDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PendingUser', PendingUserSchema);
