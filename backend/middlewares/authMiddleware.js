const jwt = require('jsonwebtoken');
require('dotenv').config();

const { JWT_SECRET } = process.env;

const authenticateAdmin = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ message: "Forbidden: Admin access only." });

        req.admin = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid or expired token." });
    }
};

module.exports = { authenticateAdmin };
