const Face = require("../models/Face");
const User = require("../models/User");

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