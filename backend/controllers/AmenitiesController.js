const Amenity = require('../models/Amenities');
const User = require('../models/User');

const bookAmenity = async (req, res) => {
    try {
        console.log("📥 Incoming Request:", req.body);

        const { amenity, bookingSlot, endSlot, userId } = req.body;
        if (!amenity || !bookingSlot || !endSlot || !userId) {
            console.error("❌ Missing required fields");
            return res.status(400).json({ message: 'All fields are required' });
        }

        const bookingStart = new Date(bookingSlot);
        const bookingEnd = new Date(endSlot);

        if (isNaN(bookingStart.getTime()) || isNaN(bookingEnd.getTime())) {
            console.error("❌ Invalid date format:", { bookingSlot, endSlot });
            return res.status(400).json({ message: 'Invalid date format' });
        }

        if (bookingStart >= bookingEnd) {
            console.error("❌ Invalid time range");
            return res.status(400).json({ message: 'End time must be later than start time.' });
        }

        // Fetch user's flat number from database
        const user = await User.findById(userId);
        if (!user) {
            console.error("❌ User not found:", userId);
            return res.status(404).json({ message: 'User not found' });
        }

        const flatNumber = user.flatNumber;

        // Find the amenity (Case Insensitive)
        const amenityObj = await Amenity.findOne({ amenity: { $regex: new RegExp(`^${amenity}$`, "i") } });
        if (!amenityObj) {
            console.error("❌ Amenity not found:", amenity);
            return res.status(404).json({ message: 'Amenity not found' });
        }

        console.log("✅ Amenity found:", amenityObj);

        // Check for overlapping bookings
        const overlappingBooking = amenityObj.bookings.find(booking =>
            (new Date(booking.bookingSlot) < bookingEnd) && (new Date(booking.endSlot) > bookingStart)
        );

        if (overlappingBooking) {
            console.error(`❌ Booking conflict detected for ${amenity}`);
            return res.status(400).json({ 
                message: `This time slot for ${amenity} is already booked!`,
                conflictingAmenity: amenity
            });
        }

        // Add booking with auto-fetched flatNumber
        amenityObj.bookings.push({ userId, bookingSlot, endSlot, flatNumber });

        try {
            await amenityObj.save();
            console.log(`✅ Booking saved successfully for ${amenity}`);
            res.status(200).json({ message: `Amenity booked successfully for Flat ${flatNumber}` });
        } catch (saveError) {
            console.error("❌ Database Save Error:", saveError);
            res.status(500).json({ error: 'Database save failed: ' + saveError.message });
        }
    } catch (err) {
        console.error("❌ Unhandled Booking Error:", err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getAllAmenities = async (req, res) => {
    try {
        const amenities = await Amenity.find();
        res.status(200).json(amenities);
    } catch (err) {
        console.error("Error fetching amenities:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = {
    bookAmenity,
    getAllAmenities
};
