const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
        status: {
            type: String,
            enum: ["applied", "shortlisted", "rejected"],
            default: "applied"
        },
        matchScore: { type: Number, default: 0 },
        appliedAt: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Application", applicationSchema);
