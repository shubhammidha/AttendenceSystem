const express = require("express");
const router = express.Router();

const { registerFace, getFaceStatus } = require("../controllers/faceController");

// Register face
router.post("/register", registerFace);

// Get face status
router.get("/status/:userId", getFaceStatus);

module.exports = router;
