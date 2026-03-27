const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class"
  },
  date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ["present", "absent"],
    default: "present"
  },
  method: {
    type: String,
    enum: ["manual", "qr", "face"],
    default: "manual"
  }
});

module.exports = mongoose.model("Attendance", attendanceSchema);