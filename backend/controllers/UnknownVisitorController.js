const UnknownVisitor = require("../models/UnknownVisitor");
const Resident = require("../models/User");
const multer = require("multer");
const path = require("path");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

// 📧 Configure Email Transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Multer setup for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// 📩 Send Email to Resident
const sendVisitorEmail = async (flatNumber, visitorName, purpose) => {
    try {
        // Fetch resident's email based on flat number
        const resident = await Resident.findOne({ flatNumber });
        if (!resident) {
            console.error(`❌ No resident found for flat number ${flatNumber}`);
            return;
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: resident.email, // Send to resident's actual email
            subject: "Unknown Visitor Request",
            html: `
                <p>Dear ${resident.username},</p>
                <p>An unknown visitor has requested access to your flat (${flatNumber}).</p>
                <p>Visitor Name: ${visitorName}</p>
                <p>Purpose: ${purpose}</p>
                <p>Please check your visitor management system.</p><br>
                <p>Regards,</p>
                <p>Security Team</p>
            `,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("❌ Error Sending Email:", error);
            } else {
                console.log("📧 Email Sent:", info.response);
            }
        });
    } catch (error) {
        console.error("❌ Error Fetching Resident Email:", error);
    }
};


// Create Unknown Visitor Request
const createUnknownVisitorRequest = async (req, res) => {
    try {
        console.log("Received Request:", req.body); // Debugging Log
        console.log("Uploaded File:", req.file); // Debugging Log
        let { name, purpose, flatNumber } = req.body;
        name = name?.trim();
        purpose = purpose?.trim();
        flatNumber = flatNumber?.trim();
        // ✅ Validate required fields
        if (!name || !purpose || !flatNumber) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // ✅ Handle Image Upload (if any)
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        } else {
            console.warn("⚠️ Image upload failed or missing.");
            return res.status(400).json({ error: "Image upload failed" });
        }
        // ✅ Create a new visitor request
        const newRequest = new UnknownVisitor({
            name,
            purpose,
            flatNumber,
            imageUrl,
            status: "Pending",
            createdAt: new Date(), // Added timestamp for tracking
        });
        // ✅ Save the request to MongoDB
        await newRequest.save();

        // 📨 Send Email Notification to Resident
        try {
            await sendVisitorEmail(flatNumber, name, purpose);
            console.log(`📩 Email sent to resident of Flat ${flatNumber}`);
        } catch (emailError) {
            console.error("🚨 Error sending email notification:", emailError.message);
        }
        // 🔔 Send Real-time Notification to Resident
        const io = req.app.get("io"); // ✅ Fetch `io` instance from app
        if (io) {
            io.emit("newVisitorRequest", {
                flatNumber,
                message: `New visitor request from ${name} for ${purpose}. Please review.`,
                imageUrl,
            });
            console.log(`📢 Real-time notification sent to Flat ${flatNumber}`);
        }
        else {
            console.warn("⚠️ Socket.io instance not found.");
        }

        return res.status(201).json({
            message: "Visitor request submitted successfully",
            visitor: newRequest,
        });    
    } catch (err) {
        console.error("Error in createUnknownVisitorRequest:", err);
        res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
};

// Get Pending Requests for Residents
const getPendingRequests = async (req, res) => {
    try {
        console.log("📡 Fetching Requests for Flat:", req.query.flatNumber);
        const flatNumber = req.query.flatNumber;
        const requests = await UnknownVisitor.find({ flatNumber, status: "Pending" });
        console.log("✅ Requests Found:", requests);
        res.status(200).json(requests);
    } catch (err) {
        console.error("❌ Error Fetching Requests:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// ✅ Approve Visitor Request & Notify Security
const approveVisitor = async (req, res) => {
    try {
        console.log(`🟢 Approving visitor with ID: ${req.params.id}`);

        // ✅ Find and update the visitor request
        const visitor = await UnknownVisitor.findById(req.params.id);

        if (!visitor) {
            console.warn(`⚠️ Visitor request not found for ID: ${req.params.id}`);
            return res.status(404).json({ error: "Visitor request not found" });
        }

        visitor.status = "Approved";
        await visitor.save();

        console.log(`✅ Visitor Approved: ${visitor.name} for Flat ${visitor.flatNumber}`);

        // 🔔 Notify Security via WebSocket
        const io = req.app.get("io");
        if (io) {
            io.emit("visitorStatusUpdate", { 
                flatNumber: visitor.flatNumber, 
                message: `✅ Visitor ${visitor.name} has been approved.`,
                visitorId: visitor._id,
                status: "Approved",
                message: `✅ Visitor ${visitor.name} has been approved.`,
            });
            console.log(`📢 Real-time approval notification sent to Flat ${visitor.flatNumber}`);
        } else {
            console.warn("⚠️ Socket.io instance not found.");
        }

        return res.json({ message: "Visitor Approved", visitor });
    } catch (err) {
        console.error("❌ Error in approveVisitor:", err);
        return res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
};

// ❌ Reject Visitor Request & Notify Security
const rejectVisitor = async (req, res) => {
    try {
        console.log(`🔴 Rejecting visitor with ID: ${req.params.id}`);

        // ✅ Find and update the visitor request
        const visitor = await UnknownVisitor.findById(req.params.id);

        if (!visitor) {
            console.warn(`⚠️ Visitor request not found for ID: ${req.params.id}`);
            return res.status(404).json({ error: "Visitor request not found" });
        }

        visitor.status = "Rejected";
        await visitor.save();

        console.log(`❌ Visitor Rejected: ${visitor.name} for Flat ${visitor.flatNumber}`);

        // 🔔 Notify Security via WebSocket
        const io = req.app.get("io");
        if (io) {
            io.emit("visitorStatusUpdate", { 
                flatNumber: visitor.flatNumber, 
                message: `❌ Visitor ${visitor.name} has been rejected.`,
                visitorId: visitor._id,
                status: "Rejected",
                message: `❌ Visitor ${visitor.name} has been rejected.`,
            });
            console.log(`📢 Real-time rejection notification sent to Flat ${visitor.flatNumber}`);
        } else {
            console.warn("⚠️ Socket.io instance not found.");
        }

        return res.json({ message: "Visitor Rejected", visitor });
    } catch (err) {
        console.error("❌ Error in rejectVisitor:", err);
        return res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
};


module.exports = { upload, createUnknownVisitorRequest, getPendingRequests, approveVisitor, rejectVisitor };
