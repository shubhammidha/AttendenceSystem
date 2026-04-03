const express = require("express");
const router = express.Router();

const { registerFace, getFaceStatus, markAttendanceViaFace } = require("../controllers/faceController");

// Register face
router.post("/register", registerFace);

// Get face status
router.get("/status/:userId", getFaceStatus);

// Mark attendance via face
router.post("/mark-attendance", markAttendanceViaFace);

module.exports = router;
