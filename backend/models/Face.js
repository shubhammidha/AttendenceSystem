const mongoose = require("mongoose");

const faceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    faceDescriptor: {
        type: String,
        required: true
    },
    faceImage: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    registeredAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Face", faceSchema);
