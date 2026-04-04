/**
 * Attendance Method Routes
 * 
 * Purpose: API routes for attendance method management
 * 
 * Routes:
 * - GET /api/attendance-method/active/:classId - Get active attendance method
 * - POST /api/attendance-method/set - Set attendance method (teacher only)
 * 
 * Usage:
 * - Students check which attendance method is active
 * - Teachers set attendance method for lectures
 * - Frontend conditionally shows attendance options based on teacher selection
 * 
 * Logic:
 * - Teacher selects method → Students see only that method
 * - No separate check needed - method selection enables the feature
 */

const express = require("express");
const router = express.Router();

const { 
    getActiveAttendanceMethod, 
    setAttendanceMethod
} = require("../controllers/attendanceMethodController");
const authMiddleware = require("../middleware/auth");

// Middleware to verify teacher role
const verifyTeacher = (req, res, next) => {
    if (req.user.role !== "teacher") {
        return res.status(403).json({ message: "Only teachers can perform this action" });
    }
    next();
};

// Get active attendance method for a class (no auth required for students)
router.get("/active/:classId", getActiveAttendanceMethod);

// Set attendance method for a lecture (teacher only)
router.post("/set", authMiddleware, verifyTeacher, setAttendanceMethod);

module.exports = router;
