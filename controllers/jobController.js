const Job = require("../models/Job");
const User = require("../models/User");
const Application = require("../models/Application");
const Notification = require("../models/Notification");

// GET /api/jobs  (all active jobs or filtered)
const getJobs = async (req, res) => {
    try {
        const { location, type, search } = req.query;
        const filter = { status: "active" };
        if (location) filter.location = { $regex: location, $options: "i" };
        if (type) filter.type = type;
        if (search) filter.title = { $regex: search, $options: "i" };

        let jobs = await Job.find(filter).sort({ createdAt: -1 }).limit(50).lean();

        // Perform AI / Skill Intersection Matching
        if (req.user) {
            const user = await User.findById(req.user.id).lean();
            if (user && user.skills?.length > 0) {
                const userSkills = user.skills.map(s => s.toLowerCase());
                jobs = jobs.map(job => {
                    let matchScore = 50; // Base default score
                    if (job.skills && job.skills.length > 0) {
                        const jobSkills = job.skills.map(s => s.toLowerCase());
                        // Strict intersection matching
                        const matchCount = jobSkills.filter(s =>
                            userSkills.some(us => us === s || us.includes(s) || s.includes(us))
                        ).length;

                        // Strict ratio: (matched skills / required skills) * 100
                        matchScore = Math.floor((matchCount / jobSkills.length) * 100);
                    } else {
                        // If no skills defined on job, it's a 50% baseline match
                        matchScore = 50;
                    }
                    return { ...job, matchScore };
                });
            } else {
                jobs = jobs.map(job => ({ ...job, matchScore: Math.floor(Math.random() * 20) + 50 })); // Penalty if no profile built
            }
            // Sort by match score descending
            jobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        }

        if (req.query.direct === 'true') {
            jobs = jobs.map(job => ({ ...job, applyNote: "Applied directly — evaluate based on interview" }));
        }

        res.json({ jobs });
    } catch (err) {
        console.error("Job fetching error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

// GET /api/jobs/:id
const getJobById = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).populate("employer", "name companyName");
        if (!job) return res.status(404).json({ message: "Job not found." });
        res.json({ job });
    } catch (err) {
        console.error("getJobById error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

// POST /api/jobs/:id/apply
const applyToJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: "Job not found." });
        if (job.status !== "active")
            return res.status(400).json({ message: "This job is no longer accepting applications." });

        const alreadyApplied = job.applicants.some(
            (a) => a.user.toString() === req.user.id
        );
        if (alreadyApplied)
            return res.status(400).json({ message: "You have already applied to this job." });

        const user = await User.findById(req.user.id);

        // Basic Match Score logic (could be more complex)
        let matchScore = 0;
        if (user.skills && job.skills && job.skills.length > 0) {
            const matches = job.skills.filter(skill => user.skills.includes(skill));
            matchScore = Math.floor((matches.length / job.skills.length) * 100);
        } else if (job.skills && job.skills.length === 0) {
            matchScore = 50; // Neutral score if no skills required
        }

        // Create Application record
        const application = await Application.create({
            user: req.user.id,
            job: req.params.id,
            matchScore,
            status: job.jobCategory === "LOCAL" ? "applied" : "applied"
        });

        // Add to Job applicants
        job.applicants.push({ user: req.user.id });
        await job.save();

        // Create Notification for Employer
        await Notification.create({
            user: job.employer,
            message: `New applicant for ${job.title}: ${user.name}`
        });

        if (job.jobCategory === "LOCAL") {
            return res.json({
                message: "Application logged. You can now contact the recruiter.",
                contact: job.contactInfo,
                application
            });
        }

        res.json({
            message: "Applied successfully. Your resume is being reviewed.",
            application
        });
    } catch (err) {
        console.error("Apply error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

// ── Employer controllers ───────────────────────────────────

// POST /api/jobs  (employer posts job)
const createJob = async (req, res) => {
    try {
        const { title, company, location, salary, type, experience, description, requirements, openings } = req.body;
        if (!title || !company || !location || !description) {
            return res.status(400).json({ message: "Title, company, location and description are required." });
        }
        const job = await Job.create({
            employer: req.user.id,
            title, company, location, salary, type, experience, description, requirements,
            openings: openings || 1,
        });
        res.status(201).json({ job, message: "Job posted successfully." });
    } catch (err) {
        console.error("Create job error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

// GET /api/employer/jobs  (get employer's own jobs)
const getEmployerJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ employer: req.user.id }).sort({ createdAt: -1 });
        res.json({ jobs });
    } catch (err) {
        res.status(500).json({ message: "Server error." });
    }
};

// GET /api/employer/jobs/:id/applicants
const getApplicants = async (req, res) => {
    try {
        const job = await Job.findOne({ _id: req.params.id, employer: req.user.id }).populate(
            "applicants.user",
            "-password"
        );
        if (!job) return res.status(404).json({ message: "Job not found." });
        res.json({ applicants: job.applicants });
    } catch (err) {
        res.status(500).json({ message: "Server error." });
    }
};

// PUT /api/employer/jobs/:id/status
const updateJobStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const job = await Job.findOneAndUpdate(
            { _id: req.params.id, employer: req.user.id },
            { status },
            { new: true }
        );
        if (!job) return res.status(404).json({ message: "Job not found." });
        res.json({ job, message: "Status updated." });
    } catch (err) {
        res.status(500).json({ message: "Server error." });
    }
};

// GET /api/employer/profile
const getEmployerProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.json({ profile: user });
    } catch (err) {
        res.status(500).json({ message: "Server error." });
    }
};

// PUT /api/employer/profile
const updateEmployerProfile = async (req, res) => {
    try {
        const allowed = ["companyName", "industry", "website", "phone", "location", "companyAbout", "companySize"];
        const updates = {};
        allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

        const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true }).select("-password");
        res.json({ profile: user, message: "Company profile updated." });
    } catch (err) {
        res.status(500).json({ message: "Server error." });
    }
};

// GET /api/employer/candidates/:id
const getCandidateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) return res.status(404).json({ message: "Candidate not found." });
        res.json({ profile: user });
    } catch (err) {
        res.status(500).json({ message: "Server error." });
    }
};

module.exports = {
    getJobs, getJobById, applyToJob, createJob,
    getEmployerJobs, getApplicants, updateJobStatus,
    getEmployerProfile, updateEmployerProfile,
    getCandidateProfile
};
