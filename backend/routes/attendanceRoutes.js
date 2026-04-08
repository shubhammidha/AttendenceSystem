const express = require("express");
const router = express.Router();
const { 
    markAttendance, 
    getAttendance, 
    getStats, 
    checkAttendanceStatus, 
    getLectureAttendance 
} = require("../controllers/attendanceController");
const authMiddleware = require("../middleware/auth");

router.post("/mark", markAttendance);
router.post("/:studentId", getAttendance);
router.get("/stats", authMiddleware, getStats);
router.get("/check/:userId/:classId", checkAttendanceStatus);
router.get("/lecture/:lectureId", authMiddleware, getLectureAttendance);

module.exports = router;
