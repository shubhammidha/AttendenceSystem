const Class = require("../models/Class");

exports.createClass = async (req, res) => {
    try {
        const { className, subject, teacher } = req.body;

        const newClass = new Class({
            className,
            subject,
            teacher
        });

        await newClass.save();
        res.status(201).json(newClass);
    } catch (error) {
        console.error("Create class error:", error);
        res.status(500).json({ message: "Failed to create class" });
    }
};

exports.addStudent = async (req, res) => {
    try {
        const { classId, studentId } = req.body;

        const updatedClass = await Class.findByIdAndUpdate(
            classId,
            { $push: { students: studentId } },
            { new: true }
        );

        res.json(updatedClass);
    } catch (error) {
        console.error("Add student error:", error);
        res.status(500).json({ message: "Failed to add student to class" });
    }
};

exports.getTeacherClasses = async (req, res) => {
    try {
        const teacherId = req.user._id;
        const classes = await Class.find({ teacher: teacherId });
        res.json(classes);
    } catch (error) {
        console.error("Get teacher classes error:", error);
        res.status(500).json({ message: "Failed to fetch teacher classes" });
    }
};

exports.getStudentClasses = async (req, res) => {
    try {
        const studentId = req.user.id;
        const classes = await Class.find({ students: studentId });
        res.json(classes);
    } catch (error) {
        console.error("Get student classes error:", error);
        res.status(500).json({ message: "Failed to fetch student classes" });
    }
};

exports.getClassStudents = async (req, res) => {
    try {
        const { classId } = req.params;
        const classData = await Class.findById(classId).populate("students", "name email");
        
        if (!classData) {
            return res.status(404).json({ message: "Class not found" });
        }
        
        res.json(classData.students);
    } catch (error) {
        console.error("Get class students error:", error);
        res.status(500).json({ message: "Failed to fetch students" });
    }
};
