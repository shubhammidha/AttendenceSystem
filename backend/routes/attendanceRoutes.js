const express = require("express");
const router = express.Router();
const {markAttendance, getAttendance, getStats, checkAttendanceStatus} = require("../controllers/attendanceController");
const authMiddleware = require("../middleware/auth");

router.post("/mark", markAttendance);
router.post("/:studentId", getAttendance);
router.get("/stats", authMiddleware, getStats); // Add authentication middleware
router.get("/check/:userId/:classId", checkAttendanceStatus);

module.exports = router;