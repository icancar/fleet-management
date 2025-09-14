const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/fleet-management";

async function hashExistingPasswords() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const User = mongoose.model(
      "User",
      new mongoose.Schema({}, { strict: false })
    );

    const users = await User.find({}).select("_id email password");

    console.log("🔐 Hashing existing passwords...");
    console.log("================================");

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      // Check if password is already hashed (bcrypt hashes start with $2a$ and are ~60 chars)
      const isAlreadyHashed =
        user.password &&
        user.password.startsWith("$2a$") &&
        user.password.length >= 50;

      if (isAlreadyHashed) {
        console.log(`⏭️  Skipping ${user.email} - already hashed`);
        skippedCount++;
        continue;
      }

      try {
        // Hash the password with bcrypt
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(user.password, saltRounds);

        // Update the user with the hashed password
        await User.findByIdAndUpdate(user._id, { password: hashedPassword });

        console.log(`✅ Updated ${user.email} - password hashed`);
        updatedCount++;
      } catch (error) {
        console.error(
          `❌ Error hashing password for ${user.email}:`,
          error.message
        );
      }
    }

    console.log("\n📊 Summary:");
    console.log(`   Total users processed: ${users.length}`);
    console.log(`   Passwords hashed: ${updatedCount}`);
    console.log(`   Already hashed (skipped): ${skippedCount}`);

    // Verify the changes
    console.log("\n🔍 Verification:");
    const updatedUsers = await User.find({}).select("email password");
    updatedUsers.forEach((user, index) => {
      const isHashed =
        user.password &&
        user.password.startsWith("$2a$") &&
        user.password.length >= 50;
      const status = isHashed ? "✅ HASHED" : "❌ PLAIN TEXT";
      console.log(`${index + 1}. ${user.email} - ${status}`);
    });

    await mongoose.disconnect();
    console.log("\n📊 Disconnected from MongoDB");
    console.log("🎉 Password hashing completed successfully!");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

hashExistingPasswords();
