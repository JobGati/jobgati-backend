const PartTimeApplication = require("../models/PartTimeApplication");
const User = require("../models/User");

// POST /api/part-time/apply
// Job seeker submits a part-time job application
const applyPartTime = async (req, res) => {
    try {
        const { jobTitle, company, location, hours, pay, phone, note, matchScore } = req.body;

        if (!jobTitle || !company || !location || !phone) {
            return res.status(400).json({ message: "jobTitle, company, location and phone are required." });
        }

        // Check for duplicate (same user + same job title)
        const alreadyApplied = await PartTimeApplication.findOne({
            user: req.user.id,
            jobTitle
        });
        if (alreadyApplied) {
            return res.status(400).json({ message: "You have already applied for this part-time job." });
        }

        const application = await PartTimeApplication.create({
            user: req.user.id,
            jobTitle,
            company,
            location,
            hours: hours || "",
            pay: pay || "",
            phone,
            note: note || "",
            matchScore: matchScore || 0
        });

        res.status(201).json({ message: "Part-time application submitted successfully.", application });
    } catch (err) {
        console.error("Part-time apply error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

// GET /api/employer/part-time-applicants
// Employer views all part-time applicants (populated with user details)
const getPartTimeApplicants = async (req, res) => {
    try {
        const applications = await PartTimeApplication.find()
            .populate("user", "-password")
            .sort({ appliedAt: -1 })
            .lean();

        res.json({ applicants: applications });
    } catch (err) {
        console.error("Get part-time applicants error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

// PUT /api/employer/part-time-applicants/:id/status
// Employer updates status (shortlisted / rejected)
const updatePartTimeStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!["applied", "shortlisted", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value." });
        }
        const app = await PartTimeApplication.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!app) return res.status(404).json({ message: "Application not found." });
        res.json({ application: app, message: "Status updated." });
    } catch (err) {
        console.error("Update part-time status error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

module.exports = { applyPartTime, getPartTimeApplicants, updatePartTimeStatus };
