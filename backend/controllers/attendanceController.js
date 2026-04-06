const Attendance = require("../models/Attendance");

// Check if attendance is already marked for today
exports.checkAttendanceStatus = async (req, res) => {
    try {
        const { userId, classId } = req.params;

        console.log("=== CHECKING ATTENDANCE STATUS ===");
        console.log("UserId:", userId);
        console.log("ClassId:", classId);
        
        // First get the active lecture for this class
        const Lecture = require("../models/Lecture");
        const activeLecture = await Lecture.findOne({
            classId: classId,
            isActive: true,
            startTime: { $lte: new Date() },
            endTime: { $gte: new Date() }
        });
        
        if (!activeLecture) {
            console.log("No active lecture found for this class");
            return res.json({ alreadyMarked: false });
        }
        
        console.log("Active lecture found:", activeLecture._id);
        
        // Check if attendance already marked for this specific lecture (not just any lecture today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const existingAttendance = await Attendance.findOne({
            student: userId,
            class: classId,
            date: {
                $gte: today
            }
        });

        console.log("Looking for attendance records from:", today);
        console.log("Found attendance record:", existingAttendance);
        
        // Only mark as already attended if attendance exists for this specific lecture
        const alreadyMarkedForLecture = existingAttendance && 
            existingAttendance.lecture && 
            existingAttendance.lecture.toString() === activeLecture._id.toString();
        
        console.log("Already marked for this lecture:", alreadyMarkedForLecture);

        res.json({
            alreadyMarked: alreadyMarkedForLecture,
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
        console.log("Get stats error:", error);
        res.status(500).json(error.message);
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
    try {
        const userId = req.user.id; // Use authenticated user ID, not from params

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
