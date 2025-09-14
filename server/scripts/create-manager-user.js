const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Connect to MongoDB
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/fleet-management";

async function createManagerUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get the admin user
    const User = mongoose.model(
      "User",
      new mongoose.Schema({}, { strict: false })
    );

    const admin = await User.findOne({ email: "admin@fleetmanagement.com" });

    if (!admin) {
      console.log("❌ Admin user not found");
      process.exit(1);
    }

    // Check if manager already exists
    const existingManager = await User.findOne({
      email: "manager@fleetmanagement.com",
    });
    if (existingManager) {
      console.log("❌ Manager user already exists");
      process.exit(0);
    }

    // Create manager user
    const hashedPassword = await bcrypt.hash("manager123", 12);

    const managerUser = new User({
      email: "manager@fleetmanagement.com",
      password: hashedPassword,
      firstName: "Jane",
      lastName: "Manager",
      role: "manager",
      isActive: true,
      managerId: admin._id,
    });

    await managerUser.save();
    console.log("✅ Manager user created successfully");
    console.log("📧 Email: manager@fleetmanagement.com");
    console.log("🔑 Password: manager123");
    console.log("👤 Role: Manager");
    console.log("👨‍💼 Manager: Admin User");
  } catch (error) {
    console.error("❌ Error creating manager user:", error);
  } finally {
    await mongoose.disconnect();
    console.log("📊 Disconnected from MongoDB");
  }
}

createManagerUser();
