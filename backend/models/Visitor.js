const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    contact: { type: String, required: true },
    visitDate: { type: Date, required: true },
    purpose: { type: String, required: true },
    flatNumber: { type: String, required: true },
    status: { type: String, default: 'Pending' },  // Pending, Approved, Denied
});

module.exports = mongoose.model('Visitor', visitorSchema);
