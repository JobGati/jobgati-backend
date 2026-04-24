const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
    {
        employer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        title: { type: String, required: true },
        company: { type: String, required: true },
        location: { type: String, required: true },
        salary: { type: String, default: "" },
        type: {
            type: String,
            enum: ["Full-time", "Part-time", "Contract", "Internship", "Freelance"],
            default: "Full-time",
        },
        experience: { type: String, default: "Fresher (0-1 yr)" },
        description: { type: String, required: true },
        requirements: { type: String, default: "" },
        skills: [{ type: String }],
        openings: { type: Number, default: 1 },
        status: { type: String, enum: ["active", "closed"], default: "active" },
        applicants: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                appliedAt: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
