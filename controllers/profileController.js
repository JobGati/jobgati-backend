const User = require("../models/User");
const { calcCompletion } = require("../utils/profileUtils");

// GET /api/profile
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found." });

        res.json({
            profile: user.toObject(),
            completion: calcCompletion(user),
        });
    } catch (err) {
        res.status(500).json({ message: "Server error." });
    }
};

// PUT /api/profile
const updateProfile = async (req, res) => {
    try {
        const allowedFields = [
            "name", "phone", "location", "about",
            "skills", "education", "degree", "experience", "resumeUrl",
        ];
        const updates = {};
        allowedFields.forEach((f) => {
            if (req.body[f] !== undefined) updates[f] = req.body[f];
        });

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select("-password");

        res.json({
            profile: user.toObject(),
            completion: calcCompletion(user),
            message: "Profile saved.",
        });
    } catch (err) {
        console.error("Profile update error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

// POST /api/profile/resume  (multer handled in route)
const uploadResume = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded." });

        // For now store filename; replace with cloud URL (S3/Cloudinary) later
        const resumeUrl = `/uploads/${req.file.filename}`;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { resumeUrl },
            { new: true }
        ).select("-password");

        res.json({ resumeUrl, completion: calcCompletion(user), message: "Resume uploaded." });
    } catch (err) {
        res.status(500).json({ message: "Server error." });
    }
};

module.exports = { getProfile, updateProfile, uploadResume };
