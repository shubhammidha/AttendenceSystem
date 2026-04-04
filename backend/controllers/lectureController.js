/**
 * Lecture Controller
 * 
 * Purpose: Handles all lecture-related operations for attendance system
 * 
 * Functions:
 * - startLecture: Creates new lecture session for teacher
 * - getActiveLectures: Returns currently active lectures for a class
 * - endLecture: Ends a lecture session (teacher only)
 * - getTeacherLectures: Returns lecture history for a teacher
 * 
 * Security:
 * - Only teachers can start/end lectures
 * - Teachers can only manage their own lectures
 * - Active lectures are time-bound
 * 
 * API Endpoints:
 * - POST /api/lecture/start - Start new lecture
 * - GET /api/lecture/active/:classId - Get active lectures
 * - PUT /api/lecture/end/:lectureId - End lecture
 * - GET /api/lecture/history - Get teacher's lectures
 * 
 * Usage Flow:
 * 1. Teacher starts lecture with title and duration
 * 2. Lecture becomes active for specified time
 * 3. Students can mark attendance during active period
 * 4. Teacher ends lecture or it expires automatically
 */

const Lecture = require("../models/Lecture");
const User = require("../models/User");

// Start a new lecture
exports.startLecture = async (req, res) => {
    try {
        const { title, classId } = req.body;
        const teacherId = req.user.id; // Get teacher ID from JWT auth middleware

        // Step 1: Verify teacher exists
        const teacher = await User.findById(teacherId);
        if (!teacher || teacher.role !== "teacher") {
            return res.status(403).json({ message: "Only teachers can start lectures" });
        }

        // Step 2: Create lecture (fixed 50 minutes duration)
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + (50 * 60 * 1000)); // Fixed 50 minutes

        const lecture = new Lecture({
            title,
            classId,
            teacher: teacherId,
            startTime,
            endTime,
            isActive: true
        });

        await lecture.save();

        res.json({
            message: "Lecture started successfully",
            lecture: {
                id: lecture._id,
                title: lecture.title,
                classId: lecture.classId,
                startTime: lecture.startTime,
                endTime: lecture.endTime,
                isActive: lecture.isActive
            }
        });

    } catch (error) {
        console.log("Start lecture error:", error);
        res.status(500).json({ message: "Failed to start lecture" });
    }
};

// Get active lectures for a class
exports.getActiveLectures = async (req, res) => {
    try {
        const { classId } = req.params;
        
        const now = new Date();
        
        const activeLectures = await Lecture.find({
            classId: classId,
            isActive: true,
            startTime: { $lte: now },
            endTime: { $gte: now }
        }).populate('teacher', 'name email');

        res.json({
            activeLectures: activeLectures.map(lecture => ({
                id: lecture._id,
                title: lecture.title,
                teacher: lecture.teacher.name,
                startTime: lecture.startTime,
                endTime: lecture.endTime,
                timeRemaining: Math.floor((lecture.endTime - now) / 1000 / 60) // minutes
            }))
        });

    } catch (error) {
        console.log("Get active lectures error:", error);
        res.status(500).json({ message: "Failed to get active lectures" });
    }
};

// End a lecture
exports.endLecture = async (req, res) => {
    try {
        const { lectureId } = req.params;
        const teacherId = req.user.id;

        const lecture = await Lecture.findById(lectureId);
        if (!lecture) {
            return res.status(404).json({ message: "Lecture not found" });
        }

        // Verify teacher owns this lecture
        if (lecture.teacher.toString() !== teacherId) {
            return res.status(403).json({ message: "You can only end your own lectures" });
        }

        lecture.isActive = false;
        lecture.endTime = new Date();
        await lecture.save();

        res.json({ message: "Lecture ended successfully" });

    } catch (error) {
        console.log("End lecture error:", error);
        res.status(500).json({ message: "Failed to end lecture" });
    }
};

// Get lecture history for teacher
exports.getTeacherLectures = async (req, res) => {
    try {
        const teacherId = req.user.id;

        const lectures = await Lecture.find({ teacher: teacherId })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({ lectures });

    } catch (error) {
        console.log("Get teacher lectures error:", error);
        res.status(500).json({ message: "Failed to get lecture history" });
    }
};
