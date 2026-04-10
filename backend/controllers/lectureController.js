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
const Attendance = require("../models/Attendance");
const Class = require("../models/Class");

// Helper function to mark absences for a lecture
const processAbsences = async (lectureId) => {
    try {
        const lecture = await Lecture.findById(lectureId);
        if (!lecture || !lecture.isActive) return;

        // AUTOMATIC ABSENT MARKING for Face or QR
        if (lecture.attendanceMethod === "face" || lecture.attendanceMethod === "qr") {
            console.log(`Auto-marking absences for ${lecture.attendanceMethod} lecture: ${lecture.title}`);
            
            // 1. Get the class to find all enrolled students
            const classData = await Class.findById(lecture.classId);
            
            if (classData && classData.students && classData.students.length > 0) {
                // 2. Get students who have already marked attendance (present or absent)
                const existingAttendance = await Attendance.find({ lecture: lectureId });
                const markedStudentIds = existingAttendance.map(a => a.student.toString());

                // 3. Identify students who haven't marked attendance
                const unmarkedStudents = classData.students.filter(
                    studentId => !markedStudentIds.includes(studentId.toString())
                );

                if (unmarkedStudents.length > 0) {
                    console.log(`Marking ${unmarkedStudents.length} students as absent`);
                    
                    const absentRecords = unmarkedStudents.map(studentId => ({
                        student: studentId,
                        class: lecture.classId,
                        lecture: lectureId,
                        status: "absent",
                        method: lecture.attendanceMethod
                    }));

                    const savedRecords = await Attendance.insertMany(absentRecords);
                    
                    // Add the new records to the lecture's attendanceMarked array
                    const recordIds = savedRecords.map(r => r._id);
                    lecture.attendanceMarked.push(...recordIds);
                }
            }
        }

        lecture.isActive = false;
        // If it was already past endTime, don't update endTime to now, keep original
        if (lecture.endTime > new Date()) {
            lecture.endTime = new Date();
        }
        await lecture.save();
        return true;
    } catch (error) {
        console.error("Error processing absences:", error);
        return false;
    }
};

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
        
        // AUTO-CLEANUP: Find any "active" lectures that have actually expired and process them
        const expiredLectures = await Lecture.find({
            classId: classId,
            isActive: true,
            endTime: { $lt: now }
        });

        if (expiredLectures.length > 0) {
            console.log(`Auto-cleaning ${expiredLectures.length} expired lectures for class ${classId}`);
            for (const lecture of expiredLectures) {
                await processAbsences(lecture._id);
            }
        }

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
                attendanceMethod: lecture.attendanceMethod || "",
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

        // Check if lecture is already ended
        if (!lecture.isActive) {
            return res.status(400).json({ message: "Lecture is already ended" });
        }

        const success = await processAbsences(lectureId);

        if (success) {
            res.json({ message: "Lecture ended successfully and absences marked" });
        } else {
            res.status(500).json({ message: "Failed to process absences" });
        }

    } catch (error) {
        console.log("End lecture error:", error);
        res.status(500).json({ message: "Failed to end lecture" });
    }
};

// Get teacher's active lectures
exports.getTeacherLectures = async (req, res) => {
    try {
        const teacherId = req.user.id;

        const lectures = await Lecture.find({ 
            teacher: teacherId,
            isActive: true 
        }).populate('attendanceMarked');

        res.json({ activeLectures: lectures });

    } catch (error) {
        console.log("Get teacher lectures error:", error);
        res.status(500).json({ message: "Failed to fetch lectures" });
    }
};

// Get teacher's active lectures
exports.getTeacherActiveLectures = async (req, res) => {
    try {
        const teacherId = req.user.id;
        const now = new Date();

        // AUTO-CLEANUP: Find any "active" lectures that have actually expired
        const expiredLectures = await Lecture.find({
            teacher: teacherId,
            isActive: true,
            endTime: { $lt: now }
        });

        if (expiredLectures.length > 0) {
            for (const lecture of expiredLectures) {
                await processAbsences(lecture._id);
            }
        }

        const lectures = await Lecture.find({ 
            teacher: teacherId,
            isActive: true,
            startTime: { $lte: now },
            endTime: { $gte: now }
        });

        res.json({ activeLectures: lectures });

    } catch (error) {
        console.log("Get teacher active lectures error:", error);
        res.status(500).json({ message: "Failed to fetch active lectures" });
    }
};

// Get all active lectures (for all teachers)
exports.getAllActiveLectures = async (req, res) => {
    try {
        const now = new Date();

        // AUTO-CLEANUP: Find any "active" lectures that have actually expired
        const expiredLectures = await Lecture.find({
            isActive: true,
            endTime: { $lt: now }
        });

        if (expiredLectures.length > 0) {
            console.log(`Auto-cleaning ${expiredLectures.length} total expired lectures...`);
            for (const lecture of expiredLectures) {
                await processAbsences(lecture._id);
            }
        }

        const activeLectures = await Lecture.find({ 
            isActive: true 
        }).populate('teacher', 'name email');

        res.json({ activeLectures });

    } catch (error) {
        console.log("Get all active lectures error:", error);
        res.status(500).json({ message: "Failed to fetch active lectures" });
    }
};

// Get teacher's lecture history
exports.getLectureHistory = async (req, res) => {
    try {
        const teacherId = req.user.id;

        const lectures = await Lecture.find({ 
            teacher: teacherId 
        }).sort({ createdAt: -1 }).limit(10);

        res.json({ lectures });

    } catch (error) {
        console.log("Get lecture history error:", error);
        res.status(500).json({ message: "Failed to fetch lecture history" });
    }
};
