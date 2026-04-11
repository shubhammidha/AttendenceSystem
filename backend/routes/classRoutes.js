const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { 
    createClass, 
    addStudent, 
    getTeacherClasses, 
    getStudentClasses, 
    getClassStudents 
} = require("../controllers/classController");

router.post("/create", auth, createClass);
router.post("/add-student", auth, addStudent);
router.get("/teacher", auth, getTeacherClasses);
router.get("/student", auth, getStudentClasses);
router.get("/:classId/students", auth, getClassStudents);

module.exports = router;
