const Class = require("../models/Class");

//Create class
exports.createClass = async (req, res) => {
    try{
        const {className, subject, teacher} = req.body;

        const newClass = new Class({
            className,
            subject,
            teacher
        });

        await newClass.save();

        res.status(201).json(newClass);
    }catch(error){
        res.status(500).json(error);
    }
};

//Add students to the class
exports.addStudent = async (req, res) => {
    try{
        const {classId, studentId} = req.body;

        const updatedClass = await Class.findByIdAndUpdate(
            classId,
            { $push: {students: studentId} },
            { new: true }
        );

        res.json(updatedClass);
    } catch (error){
        res.status(500).json(error);
    }
};

// Get all classes for a specific teacher
exports.getTeacherClasses = async (req, res) => {
    try {
        const teacherId = req.user._id;
        console.log("Fetching classes for teacherId:", teacherId);
        const classes = await Class.find({ teacher: teacherId });
        console.log("Found classes:", classes.length);
        res.json(classes);
    } catch (error) {
        console.log("Error in getTeacherClasses:", error);
        res.status(500).json({ message: "Failed to fetch teacher classes" });
    }
};

// Get all classes a student is enrolled in
exports.getStudentClasses = async (req, res) => {
    try {
        const studentId = req.user.id;
        const classes = await Class.find({ students: studentId });
        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch student classes" });
    }
};

// Get students enrolled in a class
exports.getClassStudents = async (req, res) => {
    try {
        const { classId } = req.params;
        const classData = await Class.findById(classId).populate("students", "name email");
        
        if (!classData) {
            return res.status(404).json({ message: "Class not found" });
        }
        
        res.json(classData.students);
    } catch (error) {
        console.log("Get class students error:", error);
        res.status(500).json({ message: "Failed to fetch students" });
    }
};