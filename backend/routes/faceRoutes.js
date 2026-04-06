const express = require("express");
const router = express.Router();

const { registerFace, getFaceStatus, markAttendanceViaFace, testAttendance } = require("../controllers/faceController");

// Register face
router.post("/register", registerFace);

// Get face status
router.get("/status/:userId", getFaceStatus);

// Mark attendance via face
router.post("/mark-attendance", markAttendanceViaFace);

// Test attendance endpoint
router.post("/test-attendance", testAttendance);

module.exports = router;
