/**
 * Calculate profile completion % for a user
 * @param {Object} user - Mongoose user document or object
 * @returns {number} - Completion percentage
 */
const calcCompletion = (user) => {
    if (!user) return 0;

    // For job seekers
    if (user.role === "jobseeker") {
        const checks = [
            !!(user.name && user.email && user.phone && user.location),
            !!(user.skills && user.skills.length >= 2),
            !!(user.education && user.degree),
            !!(user.experience),
            !!(user.resumeUrl),
        ];
        return Math.round((checks.filter(Boolean).length / checks.length) * 100);
    }

    // For employers (optional logic if needed)
    if (user.role === "employer") {
        const checks = [
            !!(user.name && user.email && user.companyName),
            !!(user.industry && user.website),
            !!(user.companyAbout),
        ];
        return Math.round((checks.filter(Boolean).length / checks.length) * 100);
    }

    return 0;
};

module.exports = { calcCompletion };
