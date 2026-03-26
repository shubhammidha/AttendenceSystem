const express = require("express");
const router = express.Router();

const { createClass, addStudent } = require("../controllers/classController");

router.post("/create", createClass);
router.post("/add-student", addStudent);

console.log(createClass);

module.exports = router;