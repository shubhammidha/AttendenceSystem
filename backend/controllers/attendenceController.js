const Attendence = require("../models/Attendence");

// Mark attendence
exports.markAttendence = async (req, res) => {
    try{
        const {studentId, classId} = req.body;

        const attendence = new Attendence({
            student: studentId,
            class: classId,
            status: "present",
            method: "manual"
        });

        await attendence.save();

        res.json({message: "Attendence marked"});
    } catch(error){
        res.status(500).json(error);
    }
};

// Get attendence by student
exports.getAttendence = async (req, res) => {
    try{
        const {studentId} = req.params;

        const records = await Attendence.find({student: studentId}).populate("class");

        res.json(records);
    } catch(error){
        res.status(500).json(error);
    }
};