const mongoose = require("mongoose");

const partTimeApplicationSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        jobTitle: { type: String, required: true },
        company: { type: String, required: true },
        location: { type: String, required: true },
        hours: { type: String, default: "" },
        pay: { type: String, default: "" },
        phone: { type: String, required: true },
        note: { type: String, default: "" },
        matchScore: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ["applied", "shortlisted", "rejected"],
            default: "applied"
        },
        appliedAt: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

module.exports = mongoose.model("PartTimeApplication", partTimeApplicationSchema);
