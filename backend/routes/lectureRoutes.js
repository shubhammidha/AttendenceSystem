const express = require("express");
const router = express.Router();

const { 
    startLecture, 
    getActiveLectures, 
    endLecture, 
    getLectureHistory, 
    getAllActiveLectures, 
    getTeacherActiveLectures 
} = require("../controllers/lectureController");
const authMiddleware = require("../middleware/auth");

const verifyTeacher = (req, res, next) => {
    if (req.user.role !== "teacher") {
        return res.status(403).json({ message: "Only teachers can perform this action" });
    }
    next();
};

router.post("/start", authMiddleware, verifyTeacher, startLecture);
router.get("/teacher-active", authMiddleware, verifyTeacher, getTeacherActiveLectures);
router.get("/active/:classId", getActiveLectures);
router.put("/end/:lectureId", authMiddleware, verifyTeacher, endLecture);
router.get("/active-all", authMiddleware, verifyTeacher, getAllActiveLectures);
router.get("/history", authMiddleware, verifyTeacher, getLectureHistory);

module.exports = router;
