const QRCode = require("qrcode");
const Attendance = require("../models/Attendance");


let activeQR = {}; // temp storage

//generat Qr
exports.generateQR = async (req, res) => {
    try{
        console.log(req.body);
        
        const {classId} = req.body;

        const qrData = {
            classId,
            time: Date.now()
        };

        const qrString = JSON.stringify(qrData);

        const qrImage = await QRCode.toDataURL(qrString);

        //store QR temporarily
        activeQR[classId] = qrData;

        //expire in 2 min
        setTimeout(() => {
            delete activeQR[classId];
        }, 2 * 60 * 1000);

        res.json({qrImage, qrString});
    }catch (error) {
        console.log(error);
        res.status(500).json(error.message);
    }
};

// scan QR
exports.scanQR = async (req, res) => {
    try {
        const { classId, studentId } = req.body;

        // check if qr is active
        if (!activeQR[classId]) {
            return res.status(400).json({ message: "QR expired or invalid" });
        }

        // check if attendence is already marked
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const alreadyMarked = await Attendance.findOne({
            student: studentId,
            class: classId,
            date: {
                $gte: today
            }
        });

        if (alreadyMarked) {
            return res.status(400).json({ message: "Attendance already marked" });
        }

        const attendance = new Attendance({
            student: studentId,
            class: classId,
            status: "present",
            method: "qr"
        });

        await attendance.save();

        res.json({ message: "Attendace marked via QR" });
    } catch (error) {
        console.log(error);
        res.status(500).json(error.message);
    }
};