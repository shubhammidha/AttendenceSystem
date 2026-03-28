const QRCode = require("qrcode");


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

        res.json({qrImage});
    }catch (error) {
        console.log(error);
        res.status(500).json(error.message);
}
};



exports.scanQR = async (req, res) => {
    try{
        const {classId, studentId, time} = req.body;

        const validQR = activeQR[classId];

        if(!validQR) {
            return res.status(400).json({ message: "QR expired"});
        }

        //check time diff 
        if(Date.now() - validQR.time > 2*60*1000){
            return res.status(400).json({message: "QR expired"});
        }

        //mark attendence
        const attendence = new Attendence({
            student: studentId,
            class: classId,
            method: "qr"
        });

        await attendence.save();

        res.json({ message: "Attendence marked via QR"});

    } catch(error){
        res.status(500).json(error);
    }
};


exports.scanQR = async (req, res) => {
    try{
        const { classId, studentId } = req.body;

        //check if qr is active
        if (!activeQR[classId]){
            return res.status(400).json({message: "QR expired or invalid"})
        }

        //check if attendence is already marked
        const alreadyMarked = await Attendance.findOne({
            student: studentId,
            class: classId,
            date: {
                $gte: Date.now().setHours(0, 0, 0, 0)
            }
        });

        if(alreadyMarked){
            return res.status(400).json({message: "Attendance already marked"});
        }

        const attendance = new Attendance({
            student: studentId,
            class: classId,
            status: "present",
            method: "qr"
        });

        await attendance.save();

        res.json({message: "Attendace marked via QR"});

    } catch (error){
        console.log(error);
        res.status(500).json(error.message);
    }
}