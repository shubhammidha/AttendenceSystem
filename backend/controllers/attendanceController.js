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
        
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const existingAttendance = await Attendance.findOne({
            student: userId,
            class: classId,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
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
    try {
        const { studentId, classId, lectureId, status, method } = req.body;

        // Check if attendance already exists for this student, class, and lecture
        let attendance = await Attendance.findOne({
            student: studentId,
            class: classId,
            lecture: lectureId
        });

        if (attendance) {
            // Update existing record
            attendance.status = status || "present";
            attendance.method = method || "manual";
            await attendance.save();
            return res.json({ message: "Attendance updated", attendance });
        }

        // Create new record
        attendance = new Attendance({
            student: studentId,
            class: classId,
            lecture: lectureId,
            status: status || "present",
            method: method || "manual"
        });

        await attendance.save();

        // If it's a specific lecture, we might want to update the lecture's attendanceMarked array
        if (lectureId) {
            const Lecture = require("../models/Lecture");
            await Lecture.findByIdAndUpdate(lectureId, {
                $addToSet: { attendanceMarked: attendance._id }
            });
        }

        res.json({ message: "Attendance marked", attendance });
    } catch (error) {
        console.log("Mark attendance error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get attendance for a specific lecture
exports.getLectureAttendance = async (req, res) => {
    try {
        const { lectureId } = req.params;
        const attendance = await Attendance.find({ lecture: lectureId }).populate("student", "name email");
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch lecture attendance" });
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
