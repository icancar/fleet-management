const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Connect to MongoDB
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/fleet-management";

async function createAdminUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Define the User schema (simplified version for this script)
    const UserSchema = new mongoose.Schema(
      {
        email: {
          type: String,
          required: true,
          unique: true,
          lowercase: true,
          trim: true,
        },
        password: {
          type: String,
          required: true,
        },
        firstName: {
          type: String,
          required: true,
          trim: true,
        },
        lastName: {
          type: String,
          required: true,
          trim: true,
        },
        role: {
          type: String,
          enum: ["company_owner", "manager", "driver", "admin"],
          required: true,
          default: "driver",
        },
        phone: {
          type: String,
          trim: true,
        },
        companyId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Company",
        },
        managerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
      {
        timestamps: true,
      }
    );

    const User = mongoose.model("User", UserSchema);

    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      email: "admin@fleetmanagement.com",
    });
    if (existingAdmin) {
      console.log("❌ Admin user already exists");
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 12);

    const adminUser = new User({
      email: "admin@fleetmanagement.com",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      isActive: true,
    });

    await adminUser.save();

    console.log("✅ Admin user created successfully!");
    console.log("📧 Email: admin@fleetmanagement.com");
    console.log("🔑 Password: admin123");
    console.log("👤 Role: Admin");
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  } finally {
    await mongoose.disconnect();
    console.log("📊 Disconnected from MongoDB");
  }
}

createAdminUser();
