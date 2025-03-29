const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    flatNumber: { type: String, required: true },  // ✅ Auto-fetched from User model
    bookingSlot: { type: Date, required: true },
    endSlot: { type: Date, required: true }
});

const amenitiesSchema = new mongoose.Schema({
    amenity: { type: String, required: true },
    availability: { type: Boolean, default: true },
    bookings: [bookingSchema]  // ✅ Stores all bookings
});

module.exports = mongoose.model('Amenity', amenitiesSchema);