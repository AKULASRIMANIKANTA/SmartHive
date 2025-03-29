const bcrypt = require('bcryptjs');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register a new user
const register = async (req, res) => {
    try {
        const { username, email, password, flatNumber, phoneNumber } = req.body;

        // ✅ Check if username already exists in main User collection
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: '❌ Username already taken!' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newPendingUser = new PendingUser({
            username,
            email,
            password: hashedPassword,
            flatNumber,
            phoneNumber
        });

        await newPendingUser.save();

        res.status(201).json({ message: '⏳ Registration request sent. Admin approval required!' });
    } catch (err) {
        res.status(500).json({ message: '❌ Error processing request', error: err.message });
    }
};


// Login a user
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: 'User not found' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ userId: user._id }, 'your_jwt_secret', { expiresIn: '1h' });

        res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    register,
    login
};
