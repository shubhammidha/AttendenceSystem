const Lecture = require("../models/Lecture");

exports.getActiveAttendanceMethod = async (req, res) => {
    try {
        const { classId } = req.params;
        const now = new Date();

        const activeLectures = await Lecture.find({
            classId: classId,
            isActive: true,
            startTime: { $lte: now },
            endTime: { $gte: now }
        }).populate("teacher", "name");

        if (activeLectures.length === 0) {
            return res.json({ 
                activeMethod: null,
                message: "No active lecture found"
            });
        }

        const activeLecture = activeLectures[activeLectures.length - 1];
        const activeMethod = activeLecture.attendanceMethod || "none";

        res.json({ 
            activeMethod,
            lectureId: activeLecture._id,
            lectureTitle: activeLecture.title,
            teacherName: activeLecture.teacher?.name || "Unknown Teacher"
        });

    } catch (error) {
        console.error("Get active attendance method error:", error);
        res.status(500).json({ message: "Failed to get attendance method" });
    }
};

exports.setAttendanceMethod = async (req, res) => {
    try {
        const { lectureId, method } = req.body;
        const teacherId = req.user.id;

        const lecture = await Lecture.findById(lectureId);
        if (!lecture) {
            return res.status(404).json({ message: "Lecture not found" });
        }

        if (lecture.teacher.toString() !== teacherId) {
            return res.status(403).json({ message: "You can only manage your own lectures" });
        }

        lecture.attendanceMethod = method;
        await lecture.save();

        res.json({ 
            message: "Attendance method set successfully",
            method,
            lectureTitle: lecture.title
        });

    } catch (error) {
        console.error("Set attendance method error:", error);
        res.status(500).json({ message: "Failed to set attendance method" });
    }
};
