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

// Create class
router.post("/create", auth, createClass);

// Add students to the class
router.post("/add-student", auth, addStudent);

// Get all classes for a teacher
router.get("/teacher", auth, getTeacherClasses);

// Get all classes for a student
router.get("/student", auth, getStudentClasses);

// Get students enrolled in a specific class
router.get("/:classId/students", auth, getClassStudents);

module.exports = router;
