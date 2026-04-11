const express = require("express");
const router = express.Router();

const { 
    getActiveAttendanceMethod, 
    setAttendanceMethod
} = require("../controllers/attendanceMethodController");
const authMiddleware = require("../middleware/auth");

const verifyTeacher = (req, res, next) => {
    if (req.user.role !== "teacher") {
        return res.status(403).json({ message: "Only teachers can perform this action" });
    }
    next();
};

router.get("/active/:classId", getActiveAttendanceMethod);
router.post("/set", authMiddleware, verifyTeacher, setAttendanceMethod);

module.exports = router;
