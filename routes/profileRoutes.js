const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { protect, requireRole } = require("../middleware/authMiddleware");
const { getProfile, updateProfile, uploadResume } = require("../controllers/profileController");

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) =>
        cb(null, `${req.user.id}_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        const allowed = [".pdf", ".doc", ".docx"];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error("Only PDF and Word documents are allowed."));
    },
});

router.get("/", protect, requireRole("jobseeker"), getProfile);
router.put("/", protect, requireRole("jobseeker"), updateProfile);
router.post("/resume", protect, requireRole("jobseeker"), upload.single("resume"), uploadResume);

module.exports = router;
