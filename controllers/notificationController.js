const Notification = require("../models/Notification");

// GET /api/notifications
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json({ notifications });
    } catch (err) {
        res.status(500).json({ message: "Server error." });
    }
};

// PUT /api/notifications/:id/read
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { isRead: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ message: "Notification not found." });
        res.json({ notification, message: "Marked as read." });
    } catch (err) {
        res.status(500).json({ message: "Server error." });
    }
};

// POST /api/notifications/send
const sendNotification = async (req, res) => {
    try {
        const { recipientId, title, message } = req.body;
        const notification = await Notification.create({
            user: recipientId,
            title,
            message
        });
        res.status(201).json({ notification, message: "Notification sent." });
    } catch (err) {
        res.status(500).json({ message: "Server error." });
    }
};

module.exports = { getNotifications, markAsRead, sendNotification };
