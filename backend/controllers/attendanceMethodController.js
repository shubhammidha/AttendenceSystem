/**
 * Attendance Method Controller
 * 
 * Purpose: Manages attendance method selection and status
 * 
 * Functions:
 * - getActiveAttendanceMethod: Returns current attendance method for active lecture
 * - setAttendanceMethod: Sets attendance method for a lecture
 * 
 * Usage:
 * - Students check which attendance method is active
 * - Teachers set attendance method for their lectures
 * - Frontend conditionally shows attendance options based on teacher selection
 * 
 * Logic:
 * - If teacher selects "face" → Face recognition is enabled
 * - If teacher selects "qr" → QR scanning is enabled
 * - If teacher selects "manual" → Manual attendance is enabled
 * - No active lecture → No attendance methods available
 */

const Lecture = require("../models/Lecture");

// Get active attendance method for a class
exports.getActiveAttendanceMethod = async (req, res) => {
    try {
        const { classId } = req.params;

        console.log("=== STUDENT REQUEST ===");
        console.log("Getting active method for classId:", classId);

        // Find ALL active lectures for this class (not just one)
        const activeLectures = await Lecture.find({
            classId: classId,
            isActive: true
        });

        console.log("Found", activeLectures.length, "active lectures for this class:");
        activeLectures.forEach((lecture, index) => {
            console.log(`Lecture ${index + 1}:`, {
                id: lecture._id,
                title: lecture.title,
                attendanceMethod: lecture.attendanceMethod,
                isActive: lecture.isActive,
                createdAt: lecture.createdAt
            });
        });

        if (activeLectures.length === 0) {
            console.log("No active lectures found");
            return res.json({ 
                activeMethod: null,
                message: "No active lecture found"
            });
        }

        // Get the most recent active lecture
        const activeLecture = activeLectures[activeLectures.length - 1];
        const activeMethod = activeLecture.attendanceMethod || "none";

        console.log("Using most recent lecture:", {
            id: activeLecture._id,
            title: activeLecture.title,
            attendanceMethod: activeMethod
        });

        res.json({ 
            activeMethod,
            lectureId: activeLecture._id,
            lectureTitle: activeLecture.title
        });

    } catch (error) {
        console.log("Get active attendance method error:", error);
        res.status(500).json({ message: "Failed to get attendance method" });
    }
};

// Set attendance method for a lecture
exports.setAttendanceMethod = async (req, res) => {
    try {
        const { lectureId, method } = req.body;
        const teacherId = req.user.id;

        console.log("=== SETTING ATTENDANCE METHOD ===");
        console.log("Request body:", req.body);
        console.log("Teacher ID:", teacherId);
        console.log("Lecture ID:", lectureId);
        console.log("Method:", method);

        const lecture = await Lecture.findById(lectureId);
        if (!lecture) {
            console.log("Lecture not found with ID:", lectureId);
            return res.status(404).json({ message: "Lecture not found" });
        }

        console.log("Found lecture:", {
            id: lecture._id,
            title: lecture.title,
            currentMethod: lecture.attendanceMethod,
            teacher: lecture.teacher
        });

        // Verify teacher owns this lecture
        if (lecture.teacher.toString() !== teacherId) {
            console.log("Teacher mismatch - lecture teacher:", lecture.teacher, "requesting teacher:", teacherId);
            return res.status(403).json({ message: "You can only manage your own lectures" });
        }

        // Set attendance method - this determines what students see
        lecture.attendanceMethod = method;
        await lecture.save();

        console.log("Updated lecture attendance method to:", method);

        res.json({ 
            message: "Attendance method set successfully",
            method,
            lectureTitle: lecture.title
        });

    } catch (error) {
        console.log("Set attendance method error:", error);
        res.status(500).json({ message: "Failed to set attendance method" });
    }
};
