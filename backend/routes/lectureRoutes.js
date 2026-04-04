/**
 * Lecture Routes
 * 
 * Purpose: Defines API routes for lecture management
 * 
 * Routes:
 * - POST /api/lecture/start - Start new lecture (teacher only)
 * - GET /api/lecture/active/:classId - Get active lectures for class
 * - PUT /api/lecture/end/:lectureId - End lecture (teacher only)
 * - GET /api/lecture/history - Get teacher's lecture history
 * 
 * Security:
 * - authMiddleware validates JWT tokens
 * - verifyTeacher ensures teacher-only operations
 * 
 * Usage:
 * - Frontend components call these endpoints
 * - LectureManagement component uses all routes
 * - Students can only view active lectures
 * - Teachers can manage their own lectures
 */

const express = require("express");
const router = express.Router();

const { startLecture, getActiveLectures, endLecture, getTeacherLectures } = require("../controllers/lectureController");
const authMiddleware = require("../middleware/auth");

// Middleware to verify teacher role for lecture operations
const verifyTeacher = (req, res, next) => {
    // Check if user is teacher
    if (req.user.role !== "teacher") {
        return res.status(403).json({ message: "Only teachers can perform this action" });
    }
    next();
};

// Start lecture (teacher only)
router.post("/start", authMiddleware, verifyTeacher, startLecture);

// Get active lectures for a class (no auth required for demo)
router.get("/active/:classId", getActiveLectures);

// End lecture (teacher only)
router.put("/end/:lectureId", authMiddleware, verifyTeacher, endLecture);

// Get teacher's lecture history
router.get("/history", authMiddleware, verifyTeacher, getTeacherLectures);

module.exports = router;
