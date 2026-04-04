/**
 * Authentication Middleware
 * 
 * Purpose: Validates JWT tokens and sets req.user
 * 
 * Process:
 * 1. Extract token from Authorization header
 * 2. Verify token with JWT secret
 * 3. Find user by token payload
 * 4. Set req.user with user data
 * 5. Continue to next middleware/controller
 * 
 * Usage:
 * Add to routes that require authentication
 * 
 * Example:
 * router.post('/start', authMiddleware, startLecture);
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({ message: "No token, authorization denied" });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user
        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(401).json({ message: "Token is not valid" });
        }

        // Set req.user
        req.user = user;
        next();

    } catch (error) {
        console.log("Auth middleware error:", error);
        res.status(401).json({ message: "Token is not valid" });
    }
};

module.exports = authMiddleware;
