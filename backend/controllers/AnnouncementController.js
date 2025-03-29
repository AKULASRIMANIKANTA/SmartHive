const Announcement = require('../models/Announcement');
const User = require('../models/User');
const nodemailer = require('nodemailer');
require('dotenv').config();

const { EMAIL_USER, EMAIL_PASS } = process.env;

// ✅ Create a new announcement
const createAnnouncement = async (req, res) => {
    try {
        const { title, details } = req.body; // Changed "message" to "details" for consistency
        if (!title || !details) {
            return res.status(400).json({ error: 'Title and details are required' });
        }

        const newAnnouncement = new Announcement({ title, details });
        await newAnnouncement.save();

        const emailResult = await sendAnnouncementEmails(title, details); // 📩 Notify Users

        res.status(201).json({ message: '📢 Announcement created successfully', emailStatus: emailResult });
    } catch (err) {
        console.error('❌ Error creating announcement:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// ✅ Get all announcements
const getAllAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ date: -1 });

        if (announcements.length === 0) {
            return res.status(404).json({ message: 'No announcements found' });
        }

        res.status(200).json(announcements);
    } catch (err) {
        console.error('❌ Error fetching announcements:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 📩 Send Announcement Emails
const sendAnnouncementEmails = async (title, details) => {
    try {
        const users = await User.find({}, 'email');

        if (users.length === 0) {
            console.warn("⚠️ No users found. Skipping email notifications.");
            return "No users to send emails to";
        }

        const recipientEmails = users.map(user => user.email);

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: EMAIL_USER, pass: EMAIL_PASS }
        });

        await transporter.sendMail({
            from: EMAIL_USER,
            to: recipientEmails.join(","),
            subject: `📢 New Announcement: ${title}`,
            text: details,
            html:`
            <p>${details}</p>
            <p>Regards</p>
            <p>Admin Team</p>
            <p>SmartHive</p>`
        });

        console.log(`📩 Announcement email sent to ${recipientEmails.length} users`);
        return `Emails sent to ${recipientEmails.length} users`;
    } catch (error) {
        console.error("❌ Email Notification Error:", error);
        return "Failed to send emails";
    }
};

module.exports = { createAnnouncement, getAllAnnouncements };
