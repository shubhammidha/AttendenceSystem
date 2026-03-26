const express = require("express");
const router = express.Router();
const {markAttendence, getAttendence} = require("../controllers/attendenceController");

router.post("/mark", markAttendence);
router.post("/:studentId", getAttendence);

module.exports = router;