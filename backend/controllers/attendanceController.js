const Attendance = require("../models/Attendance");

// Check if attendance is already marked for today
exports.checkAttendanceStatus = async (req, res) => {
    try {
        const { userId, classId } = req.params;

        // Check if attendance already marked today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const existingAttendance = await Attendance.findOne({
            student: userId,
            class: classId,
            date: {
                $gte: today
            }
        });

        res.json({
            alreadyMarked: !!existingAttendance,
            attendanceRecord: existingAttendance
        });

    } catch (error) {
        console.log("Check attendance status error:", error);
        res.status(500).json({ message: "Failed to check attendance status" });
    }
};

// Mark attendence
exports.markAttendance = async (req, res) => {
    try{
        const {studentId, classId} = req.body;

        const attendance = new Attendance({
            student: studentId,
            class: classId,
            status: "present",
            method: "manual"
        });

        await attendance.save();

        res.json({message: "Attendance marked"});
    } catch(error){
        res.status(500).json(error);
    }
};

// Get attendence by student
exports.getAttendance = async (req, res) => {
    try{
        const {studentId} = req.params;

        const records = await Attendance.find({student: studentId}).populate("class");

        res.json(records);
    } catch(error){
        res.status(500).json(error);
    }
};


//GET NUMBER OF PRESENT/ABSENT
exports.getStats = async (req, res) => {
    try{
        const { userId } = req.params;

        console.log("Getting stats for userId:", userId);

        //total classes
        const total = await Attendance.countDocuments({
            student: userId
        });

        console.log("Total attendance records:", total);

        //present counts
        const present = await Attendance.countDocuments({
            student: userId,
            status: "present"
        });

        console.log("Present records:", present);
        
        //absent count
        const absent = total - present;
        
        console.log("Absent records:", absent);
        
        //percentage 
        const percentage = total === 0 ? 0 : (present / total) * 100;

        console.log("Final stats:", { total, present, absent, percentage });

        res.json({
            totalClasses: total,
            present,
            absent,
            percentage: percentage.toFixed(2)
        });
    } catch(error){
        console.log("Get stats error:", error);
        res.status(500).json(error.message);
    }
}
