const Face = require("../models/Face");
const User = require("../models/User");
const Attendance = require("../models/Attendance");

// Register face for a user
exports.registerFace = async (req, res) => {
    try {
        const { userId, faceData } = req.body;
        
        // Step 1: Validate input
        if (!userId || !faceData) {
            return res.status(400).json({ message: "User ID and face data required" });
        }

        // Step 2: Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Step 3: Check if face already registered
        const existingFace = await Face.findOne({ user: userId });
        if (existingFace) {
            // Update existing face
            existingFace.faceDescriptor = faceData.descriptor;
            existingFace.faceImage = faceData.image;
            existingFace.isActive = true;
            await existingFace.save();
            
            return res.json({ message: "Face updated successfully" });
        }

        // Step 4: Create new face registration
        const newFace = new Face({
            user: userId,
            faceDescriptor: faceData.descriptor,
            faceImage: faceData.image
        });

        await newFace.save();

        res.json({ message: "Face registered successfully" });
        
    } catch (error) {
        console.log("Face registration error:", error);
        res.status(500).json({ message: "Face registration failed" });
    }
};

// Get face registration status
exports.getFaceStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Step 1: Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Step 2: Check if face is registered
        const face = await Face.findOne({ user: userId, isActive: true });
        
        res.json({
            faceRegistered: !!face,
            userId: user._id,
            name: user.name,
            registeredAt: face?.registeredAt || null
        });
        
    } catch (error) {
        console.log("Face status error:", error);
        res.status(500).json({ message: "Failed to get face status" });
    }
};

// Mark attendance via face recognition
exports.markAttendanceViaFace = async (req, res) => {
    try {
        const { userId, classId, faceData } = req.body;
        
        // Step 1: Validate input
        if (!userId || !classId || !faceData) {
            return res.status(400).json({ message: "User ID, class ID, and face data required" });
        }

        // Step 2: Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Step 3: Check if user has registered face
        const registeredFace = await Face.findOne({ user: userId, isActive: true });
        if (!registeredFace) {
            return res.status(400).json({ message: "No face registered for this user" });
        }

        // Step 4: Simulate face recognition (in production, use actual face recognition)
        // For now, we'll assume any face data matches if user has registered face
        const faceMatched = true; // Simulated match

        if (!faceMatched) {
            return res.status(400).json({ message: "Face not recognized" });
        }

        // Step 5: Check if attendance already marked today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const alreadyMarked = await Attendance.findOne({
            student: userId,
            class: classId,
            date: {
                $gte: today
            }
        });

        if (alreadyMarked) {
            return res.status(400).json({ message: "Attendance already marked today" });
        }

        // Step 6: Mark attendance
        const attendance = new Attendance({
            student: userId,
            class: classId,
            status: "present",
            method: "face",
            date: new Date()
        });

        await attendance.save();

        res.json({ 
            message: "Attendance marked successfully via face recognition",
            attendance: attendance
        });
        
    } catch (error) {
        console.log("Face attendance error:", error);
        res.status(500).json({ message: "Face attendance marking failed" });
    }
};