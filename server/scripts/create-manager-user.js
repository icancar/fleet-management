const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// User schema (simplified for script)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: {
    type: String,
    enum: ["admin", "driver", "manager", "company_owner"],
    default: "driver",
  },
  isActive: { type: Boolean, default: true },
  phone: String,
  companyId: String,
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

async function createManagerUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/fleet-management"
    );
    console.log("Connected to MongoDB");

    // Check if manager already exists
    const existingManager = await User.findOne({ email: "manager@fleet.com" });
    if (existingManager) {
      console.log("Manager user already exists:", existingManager.email);
      return;
    }

    // Create a sample company first (if needed)
    const companyId = new mongoose.Types.ObjectId().toString();

    // Hash password
    const hashedPassword = await bcrypt.hash("manager123", 10);

    // Create manager user
    const manager = new User({
      email: "manager@fleet.com",
      password: hashedPassword,
      firstName: "John",
      lastName: "Manager",
      role: "manager",
      phone: "+1234567890",
      companyId: companyId,
      isActive: true,
    });

    await manager.save();
    console.log("Manager user created successfully:");
    console.log("Email: manager@fleet.com");
    console.log("Password: manager123");
    console.log("Role: manager");
    console.log("Company ID:", companyId);

    // Create a sample driver for the manager
    const driverPassword = await bcrypt.hash("driver123", 10);
    const driver = new User({
      email: "driver@fleet.com",
      password: driverPassword,
      firstName: "Jane",
      lastName: "Driver",
      role: "driver",
      phone: "+1234567891",
      companyId: companyId,
      managerId: manager._id,
      isActive: true,
    });

    await driver.save();
    console.log("\nSample driver created:");
    console.log("Email: driver@fleet.com");
    console.log("Password: driver123");
    console.log("Role: driver");
    console.log("Manager ID:", manager._id);
  } catch (error) {
    console.error("Error creating manager user:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

createManagerUser();
