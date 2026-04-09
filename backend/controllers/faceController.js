const Face = require("../models/Face");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const Lecture = require("../models/Lecture");

// Helper function to calculate Euclidean Distance
const calculateDistance = (descriptor1, descriptor2) => {
    if (!descriptor1 || !descriptor2 || descriptor1.length !== descriptor2.length) {
        return 1.0; // Max distance if invalid
    }
    
    let sum = 0;
    for (let i = 0; i < descriptor1.length; i++) {
        sum += Math.pow(descriptor1[i] - descriptor2[i], 2);
    }
    return Math.sqrt(sum);
};

// Register face for a user
exports.registerFace = async (req, res) => {
    try {
        const { userId, faceData } = req.body;
        
        // Step 1: Validate input
        if (!userId || !faceData || !faceData.descriptor) {
            return res.status(400).json({ message: "User ID and face descriptor required" });
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

// Mark attendance via face recognition (FINAL SIMPLE VERSION)
exports.markAttendanceViaFace = async (req, res) => {
    try {
        console.log("=== BIOMETRIC FACE ATTENDANCE MARKING ===");
        
        const { userId, classId, faceData } = req.body;
        
        // Validate input
        if (!userId || !classId || !faceData || !faceData.descriptor) {
            return res.status(400).json({ message: "User ID, class ID, and face biometric data required" });
        }

        // Check if there is an active lecture with face attendance enabled
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

        // Check if user has face registered
        const registeredFace = await Face.findOne({ user: userId, isActive: true });
        if (!registeredFace) {
            return res.status(400).json({ message: "No face registered for this user." });
        }

        // BIOMETRIC VERIFICATION: Euclidean Distance
        const distance = calculateDistance(faceData.descriptor, registeredFace.faceDescriptor);
        const THRESHOLD = 0.6;
        
        console.log(`User: ${userId}`);
        console.log(`Input Descriptor Length: ${faceData.descriptor.length}`);
        console.log(`Stored Descriptor Length: ${registeredFace.faceDescriptor.length}`);
        console.log(`Biometric distance: ${distance.toFixed(4)}`);

        if (distance > THRESHOLD) {
            console.log("VERIFICATION FAILED: Face does not match.");
            return res.status(401).json({ 
                message: `Face verification failed (Score: ${distance.toFixed(3)}). Ensure you are the same person who registered.`,
                distance: distance.toFixed(4),
                match: false
            });
        }

        console.log("VERIFICATION SUCCESS: Face matched.");

        // Check if attendance already marked for this specific lecture
        const alreadyMarked = await Attendance.findOne({
            student: userId,
            lecture: activeLecture._id
        });

        if (alreadyMarked) {
            return res.status(400).json({ message: "Attendance already marked for this lecture" });
        }

        // Mark attendance linked to the active lecture
        const attendance = new Attendance({
            student: userId,
            class: classId,
            lecture: activeLecture._id,
            status: "present",
            method: "face",
            date: new Date()
        });

        await attendance.save();

        // Also add to lecture's attendanceMarked array
        activeLecture.attendanceMarked.push(attendance._id);
        await activeLecture.save();

        res.json({ 
            message: "Attendance marked successfully! Biometric match verified.",
            attendance: attendance
        });
        
    } catch (error) {
        console.log("Face attendance error:", error);
        res.status(500).json({ message: "Face attendance marking failed", error: error.message });
    }
};

// Test endpoint to isolate the issue
exports.testAttendance = async (req, res) => {
    try {
        console.log("=== TEST ATTENDANCE ENDPOINT ===");
        console.log("Request body:", req.body);
        
        const { userId, classId } = req.body;
        
        // Test 1: Check if we can create a simple attendance record
        const attendance = new Attendance({
            student: userId,
            class: classId,
            status: "present",
            method: "face",
            date: new Date()
        });

        console.log("Created attendance object:", attendance);
        
        // Test 2: Try to save it
        await attendance.save();
        console.log("Attendance saved successfully!");

        res.json({ 
            message: "Test attendance marked successfully",
            attendance: attendance
        });
        
    } catch (error) {
        console.log("Test attendance error:", error);
        console.log("Error message:", error.message);
        console.log("Error details:", error.errors);
        res.status(500).json({ message: "Test attendance failed", error: error.message });
    }
};