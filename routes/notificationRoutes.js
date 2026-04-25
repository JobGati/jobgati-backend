const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getNotifications, markAsRead, sendNotification } = require("../controllers/notificationController");

router.get("/", protect, getNotifications);
router.post("/send", protect, sendNotification);
router.put("/:id/read", protect, markAsRead);

module.exports = router;
