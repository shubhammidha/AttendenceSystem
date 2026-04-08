const QRCode = require("qrcode");
const Attendance = require("../models/Attendance");

let activeQR = {}; // temp storage

// Generate QR
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

        // Store QR temporarily (using lectureId as key for better specificity)
        const key = lectureId || classId;
        activeQR[key] = qrData;

        // Expire in 2 min
        setTimeout(() => {
            delete activeQR[key];
        }, 2 * 60 * 1000);

        res.json({ qrImage, qrString });
    } catch (error) {
        console.log("QR Generate Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Scan QR
exports.scanQR = async (req, res) => {
    try {
        const { classId, lectureId, studentId } = req.body;

        // Check if QR is active
        const key = lectureId || classId;
        if (!activeQR[key]) {
            return res.status(400).json({ message: "QR code has expired or is invalid" });
        }

        // Check if attendance is already marked for this lecture
        const query = {
            student: studentId,
            class: classId
        };
        if (lectureId) query.lecture = lectureId;
        else {
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

        // Update lecture record if lectureId exists
        if (lectureId) {
            const Lecture = require("../models/Lecture");
            await Lecture.findByIdAndUpdate(lectureId, {
                $addToSet: { attendanceMarked: attendance._id }
            });
        }

        res.json({ message: "Attendance marked successfully via QR" });
    } catch (error) {
        console.log("QR Scan Error:", error);
        res.status(500).json({ message: error.message });
    }
};
