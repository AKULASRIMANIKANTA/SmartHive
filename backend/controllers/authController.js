const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            username: user.username,
            flatNumber: user.flatNumber, // ✅ Include flatNumber in token
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
};
