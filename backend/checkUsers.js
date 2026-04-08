const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./models/User");

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const teachers = await User.find({ role: "teacher" });
        const students = await User.find({ role: "student" });

        console.log("\n--- TEACHERS ---");
        teachers.forEach(t => console.log(`ID: ${t._id} | Name: ${t.name} | Email: ${t.email}`));

        console.log("\n--- STUDENTS ---");
        students.forEach(s => console.log(`ID: ${s._id} | Name: ${s.name} | Email: ${s.email}`));

        mongoose.connection.close();
    } catch (error) {
        console.error("Error:", error);
    }
}

checkUsers();
