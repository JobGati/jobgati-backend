const express = require("express");
const router = express.Router();
const { protect, requireRole } = require("../middleware/authMiddleware");
const {
    startInterview, sendMessage, finishInterview, getLearningPath,
} = require("../controllers/interviewController");

router.post("/start", protect, requireRole("jobseeker"), startInterview);
router.post("/message", protect, requireRole("jobseeker"), sendMessage);
router.post("/finish", protect, requireRole("jobseeker"), finishInterview);
router.get("/learning-path", protect, requireRole("jobseeker"), getLearningPath);

module.exports = router;
