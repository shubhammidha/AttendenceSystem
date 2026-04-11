const QRCode = require("qrcode");
const Attendance = require("../models/Attendance");
const Lecture = require("../models/Lecture");

let activeQR = {};

exports.generateQR = async (req, res) => {
    try {
        const { classId, lectureId } = req.body;

        const qrData = {
            classId,
            lectureId,
            time: Date.now()
        };

        const qrString = JSON.stringify(qrData);
        const qrImage = await QRCode.toDataURL(qrString);

        const key = lectureId || classId;
        activeQR[key] = qrData;

        setTimeout(() => {
            delete activeQR[key];
        }, 2 * 60 * 1000);

        res.json({ qrImage, qrString });
    } catch (error) {
        console.error("QR generate error:", error);
        res.status(500).json({ message: "Failed to generate QR code" });
    }
};

exports.scanQR = async (req, res) => {
    try {
        const { classId, lectureId, studentId } = req.body;

        const key = lectureId || classId;
        if (!activeQR[key]) {
            return res.status(400).json({ message: "QR code has expired or is invalid" });
        }

        const query = {
            student: studentId,
            class: classId
        };
        
        if (lectureId) {
            query.lecture = lectureId;
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            query.date = { $gte: today };
        }

        const alreadyMarked = await Attendance.findOne(query);
        if (alreadyMarked) {
            return res.status(400).json({ message: "Attendance already marked for this session" });
        }

        const attendance = new Attendance({
            student: studentId,
            class: classId,
            lecture: lectureId,
            status: "present",
            method: "qr"
        });

        await attendance.save();

        if (lectureId) {
            await Lecture.findByIdAndUpdate(lectureId, {
                $addToSet: { attendanceMarked: attendance._id }
            });
        }

        res.json({ message: "Attendance marked successfully via QR" });
    } catch (error) {
        console.error("QR scan error:", error);
        res.status(500).json({ message: "Failed to mark attendance via QR" });
    }
};
