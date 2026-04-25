const express = require("express");
const router = express.Router();
const { protect, requireRole } = require("../middleware/authMiddleware");
const { applyPartTime } = require("../controllers/partTimeController");

// POST /api/part-time/apply  (job seeker applies)
router.post("/apply", protect, requireRole("jobseeker"), applyPartTime);

module.exports = router;
