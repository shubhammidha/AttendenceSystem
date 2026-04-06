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

// Mark attendance via face recognition (WORKING WITH DUPLICATE PREVENTION)
exports.markAttendanceViaFace = async (req, res) => {
    try {
        console.log("=== WORKING FACE ATTENDANCE MARKING ===");
        console.log("Request body:", req.body);
        
        const { userId, classId, faceData } = req.body;
        
        // Validate input
        if (!userId || !classId) {
            return res.status(400).json({ message: "User ID and class ID required" });
        }

        // Check if attendance already marked today (simple duplicate prevention)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const alreadyMarked = await Attendance.findOne({
            student: userId,
            class: classId,
            date: { $gte: today }
        });
        
        console.log("Found attendance record for today:", alreadyMarked);

        if (alreadyMarked) {
            return res.status(400).json({ message: "Attendance already marked for today" });
        }

        // Create attendance record
        const attendance = new Attendance({
            student: userId,
            class: classId,
            status: "present",
            method: "face",
            date: new Date()
        });

        console.log("Created attendance object:", attendance);
        
        // Save attendance
        await attendance.save();
        console.log("Attendance saved successfully!");

        res.json({ 
            message: "Attendance marked successfully via face recognition",
            attendance: attendance
        });
        
    } catch (error) {
        console.log("Face attendance error:", error);
        console.log("Error message:", error.message);
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