const { GoogleGenerativeAI } = require("@google/generative-ai");
const User = require("../models/User");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_INSTRUCTION = `You are JobGati AI, an expert customized career consultant for the Indian job market.

Interview Protocol:
1. TARGET ROLE: The user will identify their target role. 
2. CUSTOMIZED INTERVIEW ONLY: Strictly ask technical and situational questions for that specific role based on their profile.
3. BE UNIQUE AND DYNAMIC: Do NOT use a standard script. Use the user's specific skills and experience provided to craft highly unique questions each time. No two interviews should have the exact same questions.
4. DEEP PROBING: Ask 1 question at a time. If they mention a skill, ask a specific edge-case scenario or how they solved a problem with it.
5. VALIDATE RESPONSE (CRITICAL): Check if the user's reply is actually relevant to your question. If it is gibberish, completely unrelated, or dodging the question, DO NOT move to the next question. Reply by saying: "That doesn't seem to answer the question. Please provide a relevant answer, or let me know if you want to skip it." Only count relevant answers towards the 5 question limit.
6. NO GENERIC ADVICE: Do not give advice or evaluate their answer. Just ask the next question.
7. DURATION: Ask exactly 5 role-specific technical questions.
8. CONCLUSION: After 5 questions have been answered properly, check if you have enough information. If so, end the interview exactly with: "Thank you! I now have enough information to analyze your profile. Click 'Finish Interview' to see your results."`;

// In-memory session store
const sessions = {};

// POST /api/interview/start
const startInterview = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const sessionId = `${req.user.id}_${Date.now()}`;

        // Provide full profile context to the AI immediately
        const profileContext = `
            User Profile:
            - Name: ${user.name}
            - Skills: ${user.skills.join(", ") || "None listed"}
            - Experience: ${user.experience || "Fresher"}
            - Education: ${user.education} (${user.degree || "N/A"})
            - About: ${user.about || "Not specified"}
        `.trim();

        sessions[sessionId] = {
            userId: req.user.id,
            messages: [
                { role: "user", parts: [{ text: `${profileContext}\n\nStart the interview session.` }] }
            ],
            msgCount: 0
        };

        let firstMsg = `Hello ${user.name}! I'm your AI career consultant. To begin, what is your Target Role?`;

        sessions[sessionId].messages.push({ role: "model", parts: [{ text: firstMsg }] });

        res.json({
            sessionId,
            message: firstMsg,
        });
    } catch (err) {
        console.error("Start interview error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

// POST /api/interview/message
const sendMessage = async (req, res) => {
    try {
        const { sessionId, message } = req.body;
        const session = sessions[sessionId];
        if (!session) return res.status(404).json({ message: "Session not found." });

        session.messages.push({ role: "user", parts: [{ text: message }] });
        session.msgCount++;

        if (!process.env.GEMINI_API_KEY) {
            console.warn("⚠️ API KEY MISSING: Using fallback mock responses! Check your .env setup.");
            // Fallback mock logic if no key
            const fallbacks = [
                "That's a great role! Tell me about the tools you'd use for that job.",
                "How do you handle safety or quality control in your work?",
                "Can you describe a time you fixed a difficult problem related to this role?",
                "What training or certifications do you plan to get next?",
                "Thank you! I now have enough information to analyze your profile. Click 'Finish Interview' to see your results."
            ];
            const reply = fallbacks[Math.min(session.msgCount - 1, fallbacks.length - 1)];
            const done = reply.includes("Finish Interview");
            session.messages.push({ role: "model", parts: [{ text: reply }] });
            return res.json({ message: reply, done });
        }

        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                systemInstruction: SYSTEM_INSTRUCTION,
                generationConfig: {
                    temperature: 0.8,
                }
            });

            const chat = model.startChat({
                history: session.messages.slice(0, -1),
            });

            const result = await chat.sendMessage(message);
            const reply = result.response.text();
            const done = reply.toLowerCase().includes("finish interview");

            session.messages.push({ role: "model", parts: [{ text: reply }] });
            res.json({ message: reply, done });
        } catch (aiErr) {
            console.error("AI Message error (falling back to mock):", aiErr);
            // Dynamic Mock Fallback logic
            const fallbacks = [
                "That's a great role! Tell me about the tools you'd use for that job.",
                "How do you handle safety or quality control in your work?",
                "Can you describe a time you fixed a difficult problem related to this role?",
                "What training or certifications do you plan to get next?",
                "Thank you! I now have enough information to analyze your profile. Click 'Finish Interview' to see your results."
            ];
            const reply = fallbacks[Math.min(session.msgCount - 1, fallbacks.length - 1)];
            const done = reply.includes("Finish Interview");
            session.messages.push({ role: "model", parts: [{ text: reply }] });
            return res.json({ message: reply, done, warning: "Using fallback AI due to service unavailability." });
        }
    } catch (err) {
        console.error("SendMessage outer error:", err);
        res.status(500).json({ message: "Internal server error." });
    }
};

// POST /api/interview/finish
const finishInterview = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const session = sessions[sessionId];
        if (!session) return res.status(404).json({ message: "Session not found." });

        if (!process.env.GEMINI_API_KEY) {
            console.warn("⚠️ API KEY MISSING: Generating mock analysis data.");
            // ── Dynamic Simulated Fallback ────────────────────────
            // Extract role from transcript (usually the answer to the first question)
            const userAnswers = session.messages.filter(m => m.role === "user");
            // Index 0 is the hidden profile context, index 1 is the answer to "What is your target role?"
            const targetRoleInput = userAnswers[1]?.parts[0].text?.toLowerCase() || "";

            let mockData = {
                score: 65,
                analysis: {
                    strengths: ["Good communication", "Eager to learn", "Basic understanding"],
                    gaps: ["Advanced technical depth", "Practical experience", "Safety standards"],
                    level: "Intermediate"
                },
                courses: [
                    { title: "General Skill Mastery", provider: "JobGati", level: "Beginner", duration: "4 weeks", skill: "General", link: "#" },
                    { title: "Workplace Communication", provider: "Coursera", level: "Beginner", duration: "2 weeks", skill: "Soft Skills", link: "#" },
                    { title: "Resume Building", provider: "LinkedIn", level: "Beginner", duration: "1 week", skill: "Job Search", link: "#" }
                ]
            };

            if (targetRoleInput.includes("electrician")) {
                mockData = {
                    score: 68,
                    analysis: {
                        strengths: ["Knowledge of electrical tools", "Safety awareness", "Basic circuit logic"],
                        gaps: ["Industrial wiring standards", "MCB/DB installation", "Voltage regulation"],
                        level: "Intermediate"
                    },
                    courses: [
                        { title: "ITI Electrician Certificate", provider: "National Skill Dev", level: "Foundation", duration: "6 months", skill: "Wiring", link: "#" },
                        { title: "Electrical Safety Training", provider: "Safety First India", level: "Intermediate", duration: "2 weeks", skill: "Safety", link: "#" },
                        { title: "Home DB & MCB Installation", provider: "IIT Training Inst", level: "Beginner", duration: "3 weeks", skill: "Practical", link: "#" }
                    ]
                };
            } else if (targetRoleInput.includes("plumber")) {
                mockData = {
                    score: 62,
                    analysis: {
                        strengths: ["Pipe fitting basics", "Measurement accuracy", "Leak detection"],
                        gaps: ["Modern PEX piping", "Pump maintenance", "Blueprint reading"],
                        level: "Intermediate"
                    },
                    courses: [
                        { title: "Advanced Plumbing Workshop", provider: "Vocational Inst", level: "Intermediate", duration: "4 weeks", skill: "Hydraulics", link: "#" },
                        { title: "Modern Sanitation Systems", provider: "NPTEL", level: "Beginner", duration: "5 weeks", skill: "Sanitation", link: "#" }
                    ]
                };
            } else if (targetRoleInput.includes("dev") || targetRoleInput.includes("software") || targetRoleInput.includes("react")) {
                mockData = {
                    score: 72,
                    analysis: {
                        strengths: ["JS Fundamentals", "React logic", "UI design basics"],
                        gaps: ["State management at scale", "Unit testing", "API optimization"],
                        level: "Intermediate"
                    },
                    courses: [
                        { title: "Full Stack Mastery", provider: "Udemy", level: "Advanced", duration: "12 weeks", skill: "Node.js", link: "#" },
                        { title: "React Testing Library", provider: "Coursera", level: "Intermediate", duration: "3 weeks", skill: "Testing", link: "#" }
                    ]
                };
            }

            // Save and return
            await User.findByIdAndUpdate(req.user.id, {
                interviewScore: mockData.score,
                interviewAnalysis: mockData.analysis,
                learningPath: mockData.courses,
            });

            return res.json(mockData);
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const historyText = session.messages.map(m => `${m.role}: ${m.parts[0].text}`).join("\n");

        const prompt = `STRICT ANALYSIS TASK: Ground your response COMPLETELY in the provided transcript.

Transcript:
${historyText}

Analyze if the User answered the technical probes correctly. If they answered correctly, add to strengths. If they were vague or wrong, add to gaps and lower the score.

JSON Requirements:
1. "score": 0-100. Lower the score for every vague answer.
2. "level": "Job Ready" (>85 only if mastery shown), "Intermediate" (60-85), "Needs Development" (<60).
3. "strengths": 3 specific points based on THEIR actual answers.
4. "gaps": 3 specific weaknesses identified from THEIR vague/wrong answers.
5. "courses": EXACTLY 3 specific courses that directly address the "gaps" you identified. You MUST use platforms like Udemy, Coursera, or local vocational institutes (like ITI) depending on the job role. 
EACH course object in the array MUST strictly follow this exact schema:
{
  "title": "String (e.g. 'Advanced React for Full Stack Developers')",
  "provider": "String (e.g. 'Udemy', 'Coursera', 'Google', 'ITI')",
  "level": "String (e.g. 'Beginner', 'Intermediate', 'Advanced')",
  "duration": "String (e.g. '4 Weeks', '6 Months')",
  "skill": "String (The SPECIFIC skill this course teaches, e.g. 'React' or 'Circuit Wiring')",
  "link": "String (Just use '#')"
}

JSON format only.`;

        const result = await model.generateContent(prompt);
        let text = result.response.text();
        // Clear any markdown formatting
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        const data = JSON.parse(text);

        // Save to user
        await User.findByIdAndUpdate(req.user.id, {
            interviewScore: data.score,
            interviewAnalysis: {
                strengths: data.strengths,
                gaps: data.gaps,
                level: data.level
            },
            learningPath: data.courses,
        });

        // Cleanup
        delete sessions[sessionId];

        res.json({
            score: data.score,
            analysis: {
                strengths: data.strengths,
                gaps: data.gaps,
                level: data.level
            },
            courses: data.courses
        });
    } catch (err) {
        console.error("Finish AI error (falling back to mock):", err);
        // Extract role from transcript for better mock data
        const userAnswers = session.messages.filter(m => m.role === "user");
        const targetRoleInput = userAnswers[1]?.parts[0].text?.toLowerCase() || "";

        let mockData = {
            score: 70,
            analysis: {
                strengths: ["Good communication", "Willingness to learn", "Basic skill set"],
                gaps: ["Advanced technical depth", "Practical experience", "Certifications"],
                level: "Intermediate"
            },
            courses: [
                { title: "General Skill Mastery", provider: "JobGati", level: "Beginner", duration: "4 weeks", skill: "General", link: "#" },
                { title: "Workplace Communication", provider: "Coursera", level: "Beginner", duration: "2 weeks", skill: "Soft Skills", link: "#" }
            ]
        };

        // Save and return
        await User.findByIdAndUpdate(req.user.id, {
            interviewScore: mockData.score,
            interviewAnalysis: mockData.analysis,
            learningPath: mockData.courses,
        });

        res.json({ ...mockData, warning: "Analysis generated using local engine due to AI unavailability." });
    }
};

// GET /api/learning-path
const getLearningPath = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select(
            "interviewScore interviewAnalysis learningPath"
        );
        if (!user) return res.status(404).json({ message: "User not found." });
        res.json({
            score: user.interviewScore,
            analysis: user.interviewAnalysis,
            courses: user.learningPath,
        });
    } catch (err) {
        res.status(500).json({ message: "Server error." });
    }
};

module.exports = { startInterview, sendMessage, finishInterview, getLearningPath };
