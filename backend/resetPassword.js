const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const User = require("./models/User");

async function resetPassword() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const email = "teacher1@gmail.com";
        const newPassword = "123456";

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        const result = await User.findOneAndUpdate(
            { email: email },
            { password: hashedPassword },
            { new: true }
        );

        if (result) {
            console.log(`Password reset successfully for: ${email}`);
            console.log(`New password is: ${newPassword}`);
        } else {
            console.error(`User not found: ${email}`);
        }

    } catch (error) {
        console.error("Error resetting password:", error);
    } finally {
        await mongoose.connection.close();
    }
}

resetPassword();
