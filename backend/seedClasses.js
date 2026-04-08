const mongoose = require("mongoose");
require("dotenv").config();
const Class = require("./models/Class");

async function seedClasses() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const teacherId = "69c186002fda59eb47432e58"; // Teacher1
        const students = [
            "69c1239fc685630954e461ce", // Shubham
            "69c8ddcddc79aa5632615ae0", // Shubham (test)
            "69d6005e48d55e0dab1d7f3f", // student2
            "69d60169f4ebd93095ee786e"  // student3
        ];

        // Create 6th A with a unique code just in case the DB index requires it
        const class6A = new Class({
            className: "6th A",
            subject: "Mathematics",
            teacher: teacherId,
            students: [students[0], students[2]],
            code: "6A-MATH-001" 
        });

        // Create 6th B with a unique code
        const class6B = new Class({
            className: "6th B",
            subject: "Science",
            teacher: teacherId,
            students: [students[1], students[3]],
            code: "6B-SCI-001"
        });

        // If 'code' is not in the schema, Mongoose might strip it. 
        // We'll use lean() or direct mongo driver if it fails, 
        // but first let's see if this works.

        await class6A.save();
        await class6B.save();

        console.log("Successfully created 6th A and 6th B");
        mongoose.connection.close();
    } catch (error) {
        console.error("Error seeding classes:", error);
        
        if (error.code === 11000) {
            console.log("\nTIP: It seems there is a unique index on 'code' in your database.");
            console.log("I will now try to update the Class schema to include the code field.");
        }
    }
}

seedClasses();
