const express = require('express');
const router = express.Router();
const AnnouncementController = require('../controllers/AnnouncementController');
const { authenticateAdmin } = require('../middlewares/authMiddleware.js'); // ✅ Admin Auth Middleware

// Admin can create an announcement
router.post('/create', authenticateAdmin, AnnouncementController.createAnnouncement);

// Anyone can view announcements
router.get('/', AnnouncementController.getAllAnnouncements);

module.exports = router;
