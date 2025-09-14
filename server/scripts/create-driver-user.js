const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Connect to MongoDB
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/fleet-management";

async function createDriverUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get the manager user
    const User = mongoose.model(
      "User",
      new mongoose.Schema({}, { strict: false })
    );

    const manager = await User.findOne({
      email: "manager@fleetmanagement.com",
    });

    if (!manager) {
      console.log("❌ Manager user not found");
      process.exit(1);
    }

    // Check if driver already exists
    const existingDriver = await User.findOne({
      email: "driver@fleetmanagement.com",
    });
    if (existingDriver) {
      console.log("❌ Driver user already exists");
      process.exit(0);
    }

    // Create driver user
    const hashedPassword = await bcrypt.hash("driver123", 12);

    const driverUser = new User({
      email: "driver@fleetmanagement.com",
      password: hashedPassword,
      firstName: "John",
      lastName: "Driver",
      role: "driver",
      isActive: true,
      managerId: manager._id,
    });

    await driverUser.save();
    console.log("✅ Driver user created successfully");
    console.log("📧 Email: driver@fleetmanagement.com");
    console.log("🔑 Password: driver123");
    console.log("👤 Role: Driver");
    console.log("👨‍💼 Manager: Jane Manager");
  } catch (error) {
    console.error("❌ Error creating driver user:", error);
  } finally {
    await mongoose.disconnect();
    console.log("📊 Disconnected from MongoDB");
  }
}

createDriverUser();
