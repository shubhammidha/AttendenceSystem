/**
 * Lecture Model
 * 
 * Purpose: Manages lecture sessions for attendance tracking
 * 
 * Schema Fields:
 * - title: Lecture name/title
 * - classId: Class/subject identifier
 * - teacher: Reference to User (teacher) who created the lecture
 * - startTime: When lecture starts
 * - endTime: When lecture ends
 * - isActive: Whether lecture is currently active for attendance
 * - attendanceMethod: Method for taking attendance (face, qr, manual, none)
 * - attendanceMarked: Array of attendance records for this lecture
 * - createdAt: When lecture was created
 * 
 * Usage:
 * - Teachers create lectures for classes
 * - Students can only mark attendance during active lectures
 * - System tracks lecture lifecycle and attendance
 * - Teacher controls attendance method selection
 * 
 * Relationships:
 * - References User model (teacher)
 * - Referenced by Attendance model
 */

const mongoose = require("mongoose");

const lectureSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    classId: {
        type: String,
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    attendanceMethod: {
        type: String,
        enum: ["face", "qr", "manual", "none"],
        default: "none"
    },
    attendanceMarked: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Attendance"
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Lecture", lectureSchema);
