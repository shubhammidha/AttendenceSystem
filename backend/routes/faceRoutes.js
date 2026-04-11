const express = require("express");
const router = express.Router();

const { registerFace, getFaceStatus, markAttendanceViaFace } = require("../controllers/faceController");

router.post("/register", registerFace);
router.get("/status/:userId", getFaceStatus);
router.post("/mark-attendance", markAttendanceViaFace);

module.exports = router;
