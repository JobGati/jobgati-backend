const express = require("express");
const router = express.Router();
const { protect, requireRole } = require("../middleware/authMiddleware");
const {
    getJobs, applyToJob, createJob,
    getEmployerJobs, getApplicants, updateJobStatus,
    getEmployerProfile, updateEmployerProfile,
} = require("../controllers/jobController");

// Public / Job Seeker
router.get("/", protect, getJobs);
router.post("/:id/apply", protect, requireRole("jobseeker"), applyToJob);

// Employer — post & manage jobs
router.post("/", protect, requireRole("employer"), createJob);

module.exports = router;
