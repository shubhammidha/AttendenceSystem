const express = require("express");
const router = express.Router();
const {markAttendance, getAttendance, getStats} = require("../controllers/attendanceController");

router.post("/mark", markAttendance);
router.post("/:studentId", getAttendance);
router.get("/stats/:studentId", getStats);

module.exports = router;