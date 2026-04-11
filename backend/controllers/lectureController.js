const Lecture = require("../models/Lecture");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const Class = require("../models/Class");

const processAbsences = async (lectureId) => {
    try {
        const lecture = await Lecture.findById(lectureId);
        if (!lecture || !lecture.isActive) return;

        if (lecture.attendanceMethod === "face" || lecture.attendanceMethod === "qr") {
            const classData = await Class.findById(lecture.classId);
            
            if (classData && classData.students && classData.students.length > 0) {
                const existingAttendance = await Attendance.find({ lecture: lectureId });
                const markedStudentIds = existingAttendance.map(a => a.student.toString());

                const unmarkedStudents = classData.students.filter(
                    studentId => !markedStudentIds.includes(studentId.toString())
                );

                if (unmarkedStudents.length > 0) {
                    const absentRecords = unmarkedStudents.map(studentId => ({
                        student: studentId,
                        class: lecture.classId,
                        lecture: lectureId,
                        status: "absent",
                        method: lecture.attendanceMethod
                    }));

                    const savedRecords = await Attendance.insertMany(absentRecords);
                    const recordIds = savedRecords.map(r => r._id);
                    lecture.attendanceMarked.push(...recordIds);
                }
            }
        }

        lecture.isActive = false;
        if (lecture.endTime > new Date()) {
            lecture.endTime = new Date();
        }
        await lecture.save();
        return true;
    } catch (error) {
        console.error("Error processing absences:", error);
        return false;
    }
};

exports.startLecture = async (req, res) => {
    try {
        const { title, classId } = req.body;
        const teacherId = req.user.id;

        const teacher = await User.findById(teacherId);
        if (!teacher || teacher.role !== "teacher") {
            return res.status(403).json({ message: "Only teachers can start lectures" });
        }

        // Check if teacher already has an active lecture
        const now = new Date();
        const activeLecture = await Lecture.findOne({
            teacher: teacherId,
            isActive: true,
            endTime: { $gte: now }
        });

        if (activeLecture) {
            return res.status(400).json({ 
                message: "You already have an active lecture. Please end it before starting a new one.",
                activeLecture: {
                    id: activeLecture._id,
                    title: activeLecture.title
                }
            });
        }

        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + (50 * 60 * 1000));

        const lecture = new Lecture({
            title,
            classId,
            teacher: teacherId,
            startTime,
            endTime,
            isActive: true
        });

        await lecture.save();

        res.json({
            message: "Lecture started successfully",
            lecture: {
                id: lecture._id,
                title: lecture.title,
                classId: lecture.classId,
                startTime: lecture.startTime,
                endTime: lecture.endTime,
                isActive: lecture.isActive
            }
        });
    } catch (error) {
        console.error("Start lecture error:", error);
        res.status(500).json({ message: "Failed to start lecture" });
    }
};

exports.getActiveLectures = async (req, res) => {
    try {
        const { classId } = req.params;
        const now = new Date();
        
        const expiredLectures = await Lecture.find({
            classId: classId,
            isActive: true,
            endTime: { $lt: now }
        });

        if (expiredLectures.length > 0) {
            for (const lecture of expiredLectures) {
                await processAbsences(lecture._id);
            }
        }

        const activeLectures = await Lecture.find({
            classId: classId,
            isActive: true,
            startTime: { $lte: now },
            endTime: { $gte: now }
        }).populate('teacher', 'name email');

        res.json({
            activeLectures: activeLectures.map(lecture => ({
                id: lecture._id,
                title: lecture.title,
                teacher: lecture.teacher.name,
                startTime: lecture.startTime,
                endTime: lecture.endTime,
                attendanceMethod: lecture.attendanceMethod || "",
                timeRemaining: Math.floor((lecture.endTime - now) / 1000 / 60)
            }))
        });
    } catch (error) {
        console.error("Get active lectures error:", error);
        res.status(500).json({ message: "Failed to get active lectures" });
    }
};

exports.endLecture = async (req, res) => {
    try {
        const { lectureId } = req.params;
        const teacherId = req.user.id;

        const lecture = await Lecture.findById(lectureId);
        if (!lecture) {
            return res.status(404).json({ message: "Lecture not found" });
        }

        if (lecture.teacher.toString() !== teacherId) {
            return res.status(403).json({ message: "You can only end your own lectures" });
        }

        if (!lecture.isActive) {
            return res.status(400).json({ message: "Lecture is already ended" });
        }

        const success = await processAbsences(lectureId);

        if (success) {
            res.json({ message: "Lecture ended successfully and absences marked" });
        } else {
            res.status(500).json({ message: "Failed to process absences" });
        }
    } catch (error) {
        console.error("End lecture error:", error);
        res.status(500).json({ message: "Failed to end lecture" });
    }
};

exports.getTeacherLectures = async (req, res) => {
    try {
        const teacherId = req.user.id;

        const lectures = await Lecture.find({ 
            teacher: teacherId,
            isActive: true 
        }).populate('attendanceMarked');

        res.json({ activeLectures: lectures });
    } catch (error) {
        console.error("Get teacher lectures error:", error);
        res.status(500).json({ message: "Failed to fetch lectures" });
    }
};

exports.getTeacherActiveLectures = async (req, res) => {
    try {
        const teacherId = req.user.id;
        const now = new Date();

        const expiredLectures = await Lecture.find({
            teacher: teacherId,
            isActive: true,
            endTime: { $lt: now }
        });

        if (expiredLectures.length > 0) {
            for (const lecture of expiredLectures) {
                await processAbsences(lecture._id);
            }
        }

        const lectures = await Lecture.find({ 
            teacher: teacherId,
            isActive: true,
            startTime: { $lte: now },
            endTime: { $gte: now }
        });

        res.json({ activeLectures: lectures });
    } catch (error) {
        console.error("Get teacher active lectures error:", error);
        res.status(500).json({ message: "Failed to fetch active lectures" });
    }
};

exports.getAllActiveLectures = async (req, res) => {
    try {
        const now = new Date();

        const expiredLectures = await Lecture.find({
            isActive: true,
            endTime: { $lt: now }
        });

        if (expiredLectures.length > 0) {
            for (const lecture of expiredLectures) {
                await processAbsences(lecture._id);
            }
        }

        const activeLectures = await Lecture.find({ 
            isActive: true 
        }).populate('teacher', 'name email');

        res.json({ activeLectures });
    } catch (error) {
        console.error("Get all active lectures error:", error);
        res.status(500).json({ message: "Failed to fetch active lectures" });
    }
};

exports.getLectureHistory = async (req, res) => {
    try {
        const teacherId = req.user.id;

        const lectures = await Lecture.find({ 
            teacher: teacherId 
        }).sort({ createdAt: -1 }).limit(10);

        res.json({ lectures });
    } catch (error) {
        console.error("Get lecture history error:", error);
        res.status(500).json({ message: "Failed to fetch lecture history" });
    }
};
