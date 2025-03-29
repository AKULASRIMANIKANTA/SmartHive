const Visitor = require('../models/Visitor');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const WebSocket = require('ws');
const jwt = require("jsonwebtoken");
require('dotenv').config(); // Load environment variables

// WebSocket for real-time notifications
const wss = new WebSocket.Server({ port: 8080 });

// Configure Nodemailer with environment variables
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,  // Email from .env
        pass: process.env.EMAIL_PASS   // App password from .env
    }
});

// Create visitor request and send QR code via email
const createVisitorRequest = async (req, res) => {
    try {
        const { name, contact, visitDate, purpose, email, flatNumber } = req.body;

        const newVisitor = new Visitor({ name, contact, visitDate, purpose, email, flatNumber, status: 'Pending' });
        await newVisitor.save();

        // Generate QR Code
        const qrData = JSON.stringify({ id: newVisitor._id, name, contact, visitDate, purpose });
        const qrCodeImage = await QRCode.toDataURL(qrData);
        const qrCodeBuffer = Buffer.from(qrCodeImage.split(",")[1], "base64");

        console.log("✅ QR Code Generated Successfully");

        // Email options with attachment
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Visitor Pass QR Code',
            html: `
                <p>Hello <strong>${name}</strong>,</p>
                <p>Your visitor pass QR code is attached. Please present this code at the security gate.</p>
                <p><strong>Visit Date:</strong> ${visitDate}</p>
                <p><strong>Purpose:</strong> ${purpose}</p>
                <p><strong>Flat Number :</strong> ${flatNumber}</p>
                <p>Thank you,</p>
                <p>SmartHive Security Team</p>
            `,
            attachments: [
                {
                    filename: "visitor_qr.png",
                    content: qrCodeBuffer,
                    encoding: "base64"
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        console.log("📩 Email Sent Successfully!");

        res.status(201).json({ message: 'Visitor request created, QR code sent via email' });
    } catch (err) {
        console.error("❌ Error Sending Email:", err);
        res.status(500).json({ error: err.message });
    }
};

// Verify visitor QR code
const verifyVisitor = async (req, res) => {
    try {
        const { qrData } = req.body;
        const { id } = JSON.parse(qrData);

        const visitor = await Visitor.findById(id);
        if (!visitor) {
            return res.status(404).json({ message: "Invalid QR code" });
        }

        visitor.status = 'Approved';
        await visitor.save();

        // Notify all connected clients (including visitor-management.html)
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ message: `Visitor ${visitor.name} approved` }));
            }
        });

        res.status(200).json({ message: "Visitor entry approved" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all visitor requests
const getAllVisitors = async (req, res) => {
    try {
        const visitors = await Visitor.find();
        res.status(200).json(visitors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { createVisitorRequest, verifyVisitor, getAllVisitors };
