const express = require("express");
const multer = require("multer");
const router = express.Router();
const UnknownVisitor = require("../models/UnknownVisitor");
const VisitorController = require("../controllers/VisitorController");
const {
    createUnknownVisitorRequest,
    getPendingRequests,
    approveVisitor,
    rejectVisitor,
} = require("../controllers/UnknownVisitorController");

// ✅ Multer Configuration for File Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });
const getVisitorHistory = async (req, res) => {
    try {
        console.log("📡 Fetching Visitor History");

        const visitors = await UnknownVisitor.find().sort({ requestTime: -1 }); // Get all past visitors
        if (!Array.isArray(visitors)) {
            console.error("❌ Expected an array but got:", visitors);
            return res.status(500).json({ error: "Invalid response format" });
        }
        console.log(`✅ Found ${visitors.length} visitor records`);
        res.status(200).json(visitors);

    } catch (err) {
        console.error("❌ Error Fetching Visitor History:", err.message);
        res.status(500).json({ error: err.message });
    }
};


router.get("/history", getVisitorHistory);

// Routes for known visitors
router.post("/create", VisitorController.createVisitorRequest);
router.post("/verify", VisitorController.verifyVisitor);
router.get("/", VisitorController.getAllVisitors);

// Routes for unknown visitors
router.post("/unknown", upload.single("image"), createUnknownVisitorRequest);
router.get("/pending", getPendingRequests);
router.put("/approve/:id", approveVisitor);
router.put("/reject/:id", rejectVisitor);

module.exports = router;
