const mongoose = require("mongoose");

const interviewResultSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
        score: { type: Number, required: true },
        result: { type: String, enum: ["PASS", "FAIL"], required: true },
        takenAt: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

module.exports = mongoose.model("InterviewResult", interviewResultSchema);
