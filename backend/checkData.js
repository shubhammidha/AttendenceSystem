const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./models/User");
const Class = require("./models/Class");

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const teachers = await User.find({ role: "teacher" });
        const students = await User.find({ role: "student" });
        const classes = await Class.find().populate("teacher", "name").populate("students", "name");

        console.log("\n--- TEACHERS ---");
        teachers.forEach(t => console.log(`ID: ${t._id} | Name: ${t.name} | Email: ${t.email}`));

        console.log("\n--- STUDENTS ---");
        students.forEach(s => console.log(`ID: ${s._id} | Name: ${s.name} | Email: ${s.email}`));

        console.log("\n--- CLASSES ---");
        classes.forEach(c => {
            console.log(`ID: ${c._id} | Name: ${c.className} | Subject: ${c.subject} | Teacher: ${c.teacher?.name || 'None'}`);
            console.log(`Students (${c.students.length}): ${c.students.map(s => s.name).join(", ")}`);
        });

    } catch (error) {
        console.error("Error checking data:", error);
    } finally {
        await mongoose.connection.close();
    }
}

checkData();
