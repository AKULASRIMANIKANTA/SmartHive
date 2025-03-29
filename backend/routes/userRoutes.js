// userRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
require('dotenv').config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// ✅ REGISTER ROUTE
router.post('/register', async (req, res) => {
    const { username, email, password, flatNumber, phoneNumber } = req.body;

    try {
        // Ensure no duplicate users exist
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email already registered!" });

        const existingPendingUser = await PendingUser.findOne({ email });
        if (existingPendingUser) return res.status(400).json({ message: "Registration request already pending!" });

        // Hash password before storing
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save to PendingUser collection
        const newPendingUser = new PendingUser({
            username,
            email,
            password: hashedPassword,
            flatNumber,
            phoneNumber
        });

        await newPendingUser.save();
        res.status(201).json({ message: "Registration request sent. Waiting for admin approval." });

    } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).json({ message: "Error processing request" });
    }
});

// ✅ LOGIN ROUTE
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: "❌ User not found or not approved yet!" });

        if (!user.isApproved) return res.status(403).json({ message: "⏳ Your registration is pending admin approval!" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "❌ Invalid credentials" });

        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, user });
    } catch (err) {
        res.status(500).json({ message: "Login failed" });
    }
});

// ✅ GET USER PROFILE
router.get('/profile', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if (err) return res.sendStatus(403);
        try {
            const user = await User.findById(decoded.id);
            if (!user) return res.status(404).json({ message: 'User not found' });

            res.json({
                username: user.username,
                email: user.email,
                flatNumber: user.flatNumber,
                phoneNumber: user.phoneNumber
            });
        } catch (error) {
            res.status(500).json({ message: 'Error fetching profile' });
        }
    });
});

// ✅ UPDATE USER PROFILE
router.put('/profile', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if (err) return res.sendStatus(403);
        try {
            const { username, email, phoneNumber } = req.body;
            const user = await User.findByIdAndUpdate(
                decoded.id,
                { username, email, phoneNumber },
                { new: true }
            );

            if (!user) return res.status(404).json({ message: 'User not found' });
            res.json({ message: 'Profile updated', user });
        } catch (error) {
            res.status(500).json({ message: 'Error updating profile' });
        }
    });
});

module.exports = router;
