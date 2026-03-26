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