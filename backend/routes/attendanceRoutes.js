const express = require("express");
const router = express.Router();
const {markAttendance, getAttendance, getStats, checkAttendanceStatus} = require("../controllers/attendanceController");

router.post("/mark", markAttendance);
router.post("/:studentId", getAttendance);
router.get("/stats/:studentId", getStats);
router.get("/check/:userId/:classId", checkAttendanceStatus);

module.exports = router;