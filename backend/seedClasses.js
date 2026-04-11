const mongoose = require("mongoose");
require("dotenv").config();
const Class = require("./models/Class");

async function seedClasses() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const teacherId = "69c186002fda59eb47432e58"; // Teacher1
        const students = [
            "69c1239fc685630954e461ce", // Shubham
            "69c8ddcddc79aa5632615ae0", // Shubham (test)
            "69d6005e48d55e0dab1d7f3f", // student2
            "69d60169f4ebd93095ee786e"  // student3
        ];

        const class6A = new Class({
            className: "6th A",
            subject: "Mathematics",
            teacher: teacherId,
            students: [students[0], students[2]],
            code: "6A-MATH-001" 
        });

        const class6B = new Class({
            className: "6th B",
            subject: "Science",
            teacher: teacherId,
            students: [students[1], students[3]],
            code: "6B-SCI-001"
        });

        await class6A.save();
        await class6B.save();

        console.log("Successfully seeded classes: 6th A and 6th B");

    } catch (error) {
        if (error.code === 11000) {
            console.error("\nError: Duplicate key error. It seems there is a unique index on 'code' in your database.");
        } else {
            console.error("Error seeding classes:", error);
        }
    } finally {
        await mongoose.connection.close();
    }
}

seedClasses();
