const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true, minlength: 6 },
        role: { type: String, enum: ["jobseeker", "employer"], required: true },

        // ── Job Seeker Profile ──────────────────────
        phone: { type: String, default: "" },
        location: { type: String, default: "" },
        about: { type: String, default: "" },
        skills: [{ type: String }],
        education: { type: String, default: "" },
        degree: { type: String, default: "" },
        experience: { type: String, default: "" },
        resumeUrl: { type: String, default: "" },

        // ── Interview / Learning Path ───────────────
        interviewScore: { type: Number, default: null },
        interviewAnalysis: { type: mongoose.Schema.Types.Mixed, default: null },
        learningPath: [{ type: mongoose.Schema.Types.Mixed }],

        // ── Employer Profile ────────────────────────
        companyName: { type: String, default: "" },
        industry: { type: String, default: "" },
        website: { type: String, default: "" },
        companySize: { type: String, default: "" },
        companyAbout: { type: String, default: "" },
    },
    { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password helper
userSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Strip password from JSON output
userSchema.methods.toSafeObject = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

module.exports = mongoose.model("User", userSchema);
