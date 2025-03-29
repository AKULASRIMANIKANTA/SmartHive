const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    flatNumber: {
        type: String,
        required: [true, 'Flat Number is required'],
        trim: true
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        minlength: [3, 'Title must be at least 3 characters long']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        minlength: [5, 'Description must be at least 5 characters long']
    },
    preferredDate: {
        type: Date,
        required: [true, 'Preferred Maintenance Date is required'],
        validate: {
            validator: function (value) {
                return value >= new Date();
            },
            message: 'Preferred date must be today or in the future'
        }
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed', 'Rejected'],
        default: 'Pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save hook to log when a new request is created
RequestSchema.pre('save', function (next) {
    console.log(`📝 New maintenance request by user ${this.userId} for flat ${this.flatNumber}`);
    next();
});

module.exports = mongoose.model('Request', RequestSchema);
