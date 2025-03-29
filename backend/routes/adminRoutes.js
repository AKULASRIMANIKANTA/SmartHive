const express = require('express');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const PendingUser = require('../models/PendingUser');
const User = require('../models/User');
require('dotenv').config();

const router = express.Router();
const { ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET, EMAIL_USER, EMAIL_PASS } = process.env;

// ✅ Middleware for Admin Authentication
const authenticateAdmin = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ message: "Forbidden: Admin access only." });

        req.admin = decoded;
        next();
    } catch (err) {
        console.error("❌ Admin authentication error:", err);
        res.status(401).json({ message: "Invalid or expired token." });
    }
};

// ✅ Admin Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
});

// ✅ Get Pending Users (Protected)
router.get('/pending-users', authenticateAdmin, async (req, res) => {
    try {
        const pendingUsers = await PendingUser.find();
        res.json(pendingUsers);
    } catch (err) {
        console.error("Error fetching pending users:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// ✅ Approve/Decline User (Protected)
router.post('/approve-user', authenticateAdmin, async (req, res) => {
    const { userId, action } = req.body;

    try {
        const pendingUser = await PendingUser.findById(userId);
        if (!pendingUser) return res.status(404).json({ message: "User not found" });

        if (action === 'approve') {
            const newUser = new User({
                username: pendingUser.username,
                email: pendingUser.email,
                password: pendingUser.password,
                flatNumber: pendingUser.flatNumber,
                phoneNumber: pendingUser.phoneNumber,
                isApproved: true
            });

            await newUser.save();
            await sendEmail(pendingUser.email, "Approved", "✅ Your registration has been approved!");
        } else {
            await sendEmail(pendingUser.email, "Declined", "❌ Your registration was declined.");
        }

        await PendingUser.findByIdAndDelete(userId);
        res.json({ message: `User ${action}d successfully` });

    } catch (err) {
        console.error("Approval Error:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// ✅ Email Notification Function
const sendEmail = async (email, status, message) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: EMAIL_USER, pass: EMAIL_PASS }
        });

        await transporter.sendMail({ from: EMAIL_USER, to: email, subject: `Registration ${status}`, text: message });
        console.log(`📩 Email sent to ${email}`);
    } catch (error) {
        console.error("Email Error:", error);
    }
};

module.exports = router;
