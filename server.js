// server.js
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require("http");
const socketIo = require("socket.io");

dotenv.config();

// ✅ Express App Setup
const app = express();
const server = http.createServer(app); // 🔹 Create HTTP server for WebSockets
const io = socketIo(server, { cors: { origin: "*" } }); // 🔹 WebSocket Setup
const port = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/media', express.static(path.join(__dirname, 'media')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// ✅ Attach io to app (to be accessed in controllers)
app.set("io", io);

// ✅ Models
const User = require('./backend/models/User');
const Flat = mongoose.model('Flat', new mongoose.Schema({ flatNumber: String }));

// ✅ Initialize Flats if Not Exist
const initFlats = async () => {
    try {
        const count = await Flat.countDocuments();
        if (count === 0) {
            const flats = [];
            for (let floor = 1; floor <= 5; floor++) {
                for (let flat = 1; flat <= 10; flat++) {
                    let flatNumber = `A${floor}0${flat}`;
                    flats.push({ flatNumber });
                }
            }
            await Flat.insertMany(flats);
            console.log('🏢 Flats Data Initialized (A101 - A510)');
        }
    } catch (err) {
        console.error('❌ Error initializing flats:', err);
    }
};

// ✅ Run flat initialization after DB connects
mongoose.connection.once('open', initFlats);

// ✅ Import Routes
const adminRoutes = require('./backend/routes/adminRoutes');
const userRoutes = require('./backend/routes/userRoutes');
const requestRoutes = require('./backend/routes/requestsRoutes');
const visitorRoutes = require('./backend/routes/VisitorRoutes');
const amenitiesRoutes = require('./backend/routes/amenitiesRoutes');
const announcementRoutes = require('./backend/routes/announcementRoutes');
const dashboardRoutes = require('./backend/routes/dashboard');

// ✅ API Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/users', userRoutes);
app.use('/api/visitor', visitorRoutes);
app.use('/api/amenities', amenitiesRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/admin', adminRoutes);

// ✅ Enforce Flat Number Validation in Registration API
app.use('/api/users/register', async (req, res, next) => {
    try {
        const { flatNumber } = req.body;
        const validFlat = await Flat.findOne({ flatNumber });

        if (!validFlat) {
            return res.status(400).json({ message: `❌ Invalid flat number. Choose between A101 - A510.` });
        }
        next();
    } catch (error) {
        console.error('❌ Flat number validation error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ✅ Root Route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🌐 WebSocket Connection
io.on("connection", (socket) => {
    console.log("🔗 WebSocket Connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("❌ WebSocket Disconnected:", socket.id);
    });
});

// ✅ Start Server with Port Handling
const startServer = (port) => {
    server.listen(port, () => console.log(`🚀 Server running on port ${port}`));

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`⚠️ Port ${port} is in use, trying port ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('❌ Server error:', err);
            process.exit(1);
        }
    });
};

startServer(port);

// ✅ Export app for controllers
module.exports = { app, server };
