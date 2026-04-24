const express = require("express");
const router = express.Router();
const { protect, requireRole } = require("../middleware/authMiddleware");
const {
    getEmployerJobs, getApplicants, updateJobStatus,
    getEmployerProfile, updateEmployerProfile,
} = require("../controllers/jobController");

router.get("/profile", protect, requireRole("employer"), getEmployerProfile);
router.put("/profile", protect, requireRole("employer"), updateEmployerProfile);
router.get("/jobs", protect, requireRole("employer"), getEmployerJobs);
router.get("/jobs/:id/applicants", protect, requireRole("employer"), getApplicants);
router.put("/jobs/:id/status", protect, requireRole("employer"), updateJobStatus);

module.exports = router;
