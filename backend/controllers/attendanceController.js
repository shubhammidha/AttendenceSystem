const Attendance = require("../models/Attendance");
const Lecture = require("../models/Lecture");

exports.checkAttendanceStatus = async (req, res) => {
    try {
        const { userId, classId } = req.params;

        const activeLecture = await Lecture.findOne({
            classId: classId,
            isActive: true,
            startTime: { $lte: new Date() },
            endTime: { $gte: new Date() }
        });
        
        if (!activeLecture) {
            return res.json({ alreadyMarked: false });
        }
        
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

        const alreadyMarkedForLecture = existingAttendance && 
            existingAttendance.lecture && 
            existingAttendance.lecture.toString() === activeLecture._id.toString();
        
        res.json({
            alreadyMarked: alreadyMarkedForLecture,
            attendanceRecord: existingAttendance
        });

    } catch (error) {
        console.error("Check attendance status error:", error);
        res.status(500).json({ message: "Failed to check attendance status" });
    }
};

exports.markAttendance = async (req, res) => {
    try {
        const { studentId, classId, lectureId, status, method } = req.body;

        let attendance = await Attendance.findOne({
            student: studentId,
            class: classId,
            lecture: lectureId
        });

        if (attendance) {
            attendance.status = status || "present";
            attendance.method = method || "manual";
            await attendance.save();
            return res.json({ message: "Attendance updated", attendance });
        }

        attendance = new Attendance({
            student: studentId,
            class: classId,
            lecture: lectureId,
            status: status || "present",
            method: method || "manual"
        });

        await attendance.save();

        if (lectureId) {
            await Lecture.findByIdAndUpdate(lectureId, {
                $addToSet: { attendanceMarked: attendance._id }
            });
        }

        res.json({ message: "Attendance marked", attendance });
    } catch (error) {
        console.error("Mark attendance error:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.getLectureAttendance = async (req, res) => {
    try {
        const { lectureId } = req.params;
        const attendance = await Attendance.find({ lecture: lectureId }).populate("student", "name email");
        res.json(attendance);
    } catch (error) {
        console.error("Get lecture attendance error:", error);
        res.status(500).json({ message: "Failed to fetch lecture attendance" });
    }
};

exports.getAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;
        const records = await Attendance.find({ student: studentId }).populate("class");
        res.json(records);
    } catch (error) {
        console.error("Get attendance error:", error);
        res.status(500).json({ message: "Failed to fetch attendance records" });
    }
};

exports.getStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const total = await Attendance.countDocuments({
            student: userId
        });

        const present = await Attendance.countDocuments({
            student: userId,
            status: "present"
        });

        const absent = total - present;
        const percentage = total === 0 ? 0 : (present / total) * 100;

        res.json({
            totalClasses: total,
            present,
            absent,
            percentage: percentage.toFixed(2)
        });
    } catch (error) {
        console.error("Get stats error:", error);
        res.status(500).json({ message: error.message });
    }
};
