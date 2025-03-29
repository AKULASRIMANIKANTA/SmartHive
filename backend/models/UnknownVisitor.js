const mongoose = require("mongoose");

const unknownVisitorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    purpose: { type: String, required: true },
    flatNumber: { type: String, required: true },
    requestTime: { type: Date, default: Date.now },
    status: { type: String, default: "Pending" },
    imageUrl: { type: String, default: null }, // ✅ Remove `req.file`
});

module.exports = mongoose.model("UnknownVisitor", unknownVisitorSchema);