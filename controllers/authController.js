const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { calcCompletion } = require("../utils/profileUtils");

const generateToken = (userId) =>
    jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

// POST /api/auth/register
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are required." });
        }
        if (!["jobseeker", "employer"].includes(role)) {
            return res.status(400).json({ message: "Role must be jobseeker or employer." });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: "Email already registered." });
        }

        const user = await User.create({ name, email, password, role });
        const token = generateToken(user._id);

        res.status(201).json({
            user: user.toSafeObject(),
            token,
            completion: calcCompletion(user)
        });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ message: "Server error. Please try again." });
    }
};

// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const token = generateToken(user._id);
        res.json({
            user: user.toSafeObject(),
            token,
            completion: calcCompletion(user)
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error. Please try again." });
    }
};

// GET /api/auth/me
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found." });
        res.json({
            user: user.toSafeObject(),
            completion: calcCompletion(user)
        });
    } catch (err) {
        res.status(500).json({ message: "Server error." });
    }
};

module.exports = { register, login, getMe };
