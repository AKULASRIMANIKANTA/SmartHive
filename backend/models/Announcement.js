const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    details: { type: String, required: true }, // Changed from "message" to match frontend
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Announcement', announcementSchema);
