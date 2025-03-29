require('dotenv').config();
const express = require('express');
const multer = require('multer');
const router = express.Router();
const Request = require('../models/Requests');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// ✅ Multer Storage Configuration for Image Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = './uploads/';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true }); // Ensure directory exists
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// ✅ Email Configuration (Uses .env for security)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // App password for security
    }
});

router.use(express.json());

// ✅ Submit Maintenance Request (with Image)
router.post('/', upload.single('issueImage'), async (req, res) => {
    try {
        // ✅ Extract & Verify JWT Token
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided.' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        // ✅ Extract Request Body
        const { title, description, preferredDate } = req.body;
        let flatNumber = req.body.flatNumber;

        // Ensure flatNumber is a string (handle cases where it's sent as an array)
        if (Array.isArray(flatNumber)) {
            flatNumber = flatNumber[0];
        }

        if (!title?.trim() || !description?.trim() || !preferredDate || !flatNumber?.trim()) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // ✅ Prevent duplicate submissions within 5 seconds
        const existingRequest = await Request.findOne({
            userId: user._id,
            title,
            description,
            createdAt: { $gte: new Date(Date.now() - 5000) } // Check last 5 seconds
        });

        if (existingRequest) {
            return res.status(400).json({ message: 'Duplicate request detected. Please wait before submitting again.' });
        }

        // ✅ Image Processing
        let imagePath = null;
        if (req.file) {
            imagePath = `${process.env.BASE_URL}/uploads/${req.file.filename}`;
        }

        // ✅ Create New Request in Database
        const newRequest = new Request({
            userId: user._id,
            flatNumber,
            title,
            description,
            preferredDate,
            imageUrl: imagePath,
            status: 'Pending'
        });

        await newRequest.save();
        console.log(`📝 New maintenance request by user ${user._id} for flat ${flatNumber}`);

        // ✅ Prepare Email Notification
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.MAINTENANCE_EMAIL, // Target email from .env
            subject: `New Maintenance Request: ${title}`,
            html: `
                <h2>📌 New Maintenance Request</h2>
                <p><strong>🏠 Flat Number:</strong> ${flatNumber}</p>
                <p><strong>🧾 Title:</strong> ${title}</p>
                <p><strong>📖 Description:</strong> ${description}</p>
                <p><strong>📆 Preferred Date:</strong> ${new Date(preferredDate).toLocaleDateString()}</p>
                ${imagePath ? `<p><strong>📸 Issue Image:</strong> <a href="${imagePath}" target="_blank">View Image</a></p>` : ''}
            `,
            attachments: req.file ? [{ filename: req.file.filename, path: `./uploads/${req.file.filename}` }] : []
        };

        await transporter.sendMail(mailOptions);

        res.status(201).json({ message: '✅ Request submitted and email sent.', imageUrl: imagePath });

    } catch (err) {
        console.error('⚠️ Error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// ✅ Fetch All Maintenance Requests (Admin Panel)
router.get('/', async (req, res) => {
    try {
        const requests = await Request.find().sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (err) {
        console.error('⚠️ Error fetching requests:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
