const Face = require("../models/Face");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const Lecture = require("../models/Lecture");

const calculateDistance = (descriptor1, descriptor2) => {
    if (!descriptor1 || !descriptor2 || descriptor1.length !== descriptor2.length) {
        return 1.0;
    }
    
    let sum = 0;
    for (let i = 0; i < descriptor1.length; i++) {
        sum += Math.pow(descriptor1[i] - descriptor2[i], 2);
    }
    return Math.sqrt(sum);
};

exports.registerFace = async (req, res) => {
    try {
        const { userId, faceData } = req.body;
        
        if (!userId || !faceData || !faceData.descriptor) {
            return res.status(400).json({ message: "User ID and face descriptor required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const existingFace = await Face.findOne({ user: userId });
        if (existingFace) {
            existingFace.faceDescriptor = faceData.descriptor;
            existingFace.faceImage = faceData.image;
            existingFace.isActive = true;
            await existingFace.save();
            
            return res.json({ message: "Face updated successfully" });
        }

        const newFace = new Face({
            user: userId,
            faceDescriptor: faceData.descriptor,
            faceImage: faceData.image
        });

        await newFace.save();

        res.json({ message: "Face registered successfully" });
    } catch (error) {
        console.error("Face registration error:", error);
        res.status(500).json({ message: "Face registration failed" });
    }
};

exports.getFaceStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const face = await Face.findOne({ user: userId, isActive: true });
        
        res.json({
            faceRegistered: !!face,
            userId: user._id,
            name: user.name,
            registeredAt: face?.registeredAt || null
        });
    } catch (error) {
        console.error("Face status error:", error);
        res.status(500).json({ message: "Failed to get face status" });
    }
};

exports.markAttendanceViaFace = async (req, res) => {
    try {
        const { userId, classId, faceData } = req.body;
        
        if (!userId || !classId || !faceData || !faceData.descriptor) {
            return res.status(400).json({ message: "User ID, class ID, and face biometric data required" });
        }

        const now = new Date();
        const activeLecture = await Lecture.findOne({
            classId: classId,
            isActive: true,
            attendanceMethod: "face",
            startTime: { $lte: now },
            endTime: { $gte: now }
        });

        if (!activeLecture) {
            return res.status(400).json({ 
                message: "Face attendance is not currently active for this class." 
            });
        }

        const registeredFace = await Face.findOne({ user: userId, isActive: true });
        if (!registeredFace) {
            return res.status(400).json({ message: "No face registered for this user." });
        }

        const distance = calculateDistance(faceData.descriptor, registeredFace.faceDescriptor);
        const THRESHOLD = 0.6;
        
        if (distance > THRESHOLD) {
            return res.status(401).json({ 
                message: `Face verification failed (Score: ${distance.toFixed(3)}). Ensure you are the same person who registered.`,
                distance: distance.toFixed(4),
                match: false
            });
        }

        const alreadyMarked = await Attendance.findOne({
            student: userId,
            lecture: activeLecture._id
        });

        if (alreadyMarked) {
            return res.status(400).json({ message: "Attendance already marked for this lecture" });
        }

        const attendance = new Attendance({
            student: userId,
            class: classId,
            lecture: activeLecture._id,
            status: "present",
            method: "face",
            date: new Date()
        });

        await attendance.save();

        activeLecture.attendanceMarked.push(attendance._id);
        await activeLecture.save();

        res.json({ 
            message: "Attendance marked successfully! Biometric match verified.",
            attendance: attendance
        });
    } catch (error) {
        console.error("Face attendance error:", error);
        res.status(500).json({ message: "Face attendance marking failed", error: error.message });
    }
};
