const express = require("express");
const router = express.Router();
const { protect, requireRole } = require("../middleware/authMiddleware");
const {
    getEmployerJobs, getApplicants, updateJobStatus,
    getEmployerProfile, updateEmployerProfile,
    getCandidateProfile
} = require("../controllers/jobController");
const { getPartTimeApplicants, updatePartTimeStatus } = require("../controllers/partTimeController");

router.get("/profile", protect, requireRole("employer"), getEmployerProfile);
router.put("/profile", protect, requireRole("employer"), updateEmployerProfile);
router.get("/candidates/:id", protect, requireRole("employer"), getCandidateProfile);
router.get("/jobs", protect, requireRole("employer"), getEmployerJobs);
router.get("/jobs/:id/applicants", protect, requireRole("employer"), getApplicants);
router.put("/jobs/:id/status", protect, requireRole("employer"), updateJobStatus);
router.get("/part-time-applicants", protect, requireRole("employer"), getPartTimeApplicants);
router.put("/part-time-applicants/:id/status", protect, requireRole("employer"), updatePartTimeStatus);

module.exports = router;
