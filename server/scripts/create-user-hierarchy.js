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

async function createUserHierarchy() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/fleet-management"
    );
    console.log("Connected to MongoDB");

    // Create a sample company ID
    const companyId = new mongoose.Types.ObjectId().toString();

    // 1. Create Company Owner
    const ownerPassword = await bcrypt.hash("owner123", 10);
    const companyOwner = new User({
      email: "owner@fleet.com",
      password: ownerPassword,
      firstName: "Alice",
      lastName: "Owner",
      role: "company_owner",
      phone: "+1234567890",
      companyId: companyId,
      isActive: true,
    });

    await companyOwner.save();
    console.log("✅ Company Owner created:");
    console.log(`   Email: ${companyOwner.email}`);
    console.log(`   Password: owner123`);
    console.log(`   ID: ${companyOwner._id}`);
    console.log(`   Company ID: ${companyId}`);

    // 2. Create Managers
    const manager1Password = await bcrypt.hash("manager123", 10);
    const manager1 = new User({
      email: "manager1@fleet.com",
      password: manager1Password,
      firstName: "Bob",
      lastName: "Manager",
      role: "manager",
      phone: "+1234567891",
      companyId: companyId,
      isActive: true,
    });

    await manager1.save();
    console.log("\n✅ Manager 1 created:");
    console.log(`   Email: ${manager1.email}`);
    console.log(`   Password: manager123`);
    console.log(`   ID: ${manager1._id}`);

    const manager2Password = await bcrypt.hash("manager456", 10);
    const manager2 = new User({
      email: "manager2@fleet.com",
      password: manager2Password,
      firstName: "Carol",
      lastName: "Supervisor",
      role: "manager",
      phone: "+1234567892",
      companyId: companyId,
      isActive: true,
    });

    await manager2.save();
    console.log("\n✅ Manager 2 created:");
    console.log(`   Email: ${manager2.email}`);
    console.log(`   Password: manager456`);
    console.log(`   ID: ${manager2._id}`);

    // 3. Create Drivers for Manager 1
    const drivers1 = [
      {
        email: "driver1@fleet.com",
        password: "driver123",
        firstName: "David",
        lastName: "Driver",
        phone: "+1234567893",
      },
      {
        email: "driver2@fleet.com",
        password: "driver456",
        firstName: "Emma",
        lastName: "Pilot",
        phone: "+1234567894",
      },
    ];

    console.log("\n✅ Creating drivers for Manager 1:");
    for (const driverData of drivers1) {
      const driverPassword = await bcrypt.hash(driverData.password, 10);
      const driver = new User({
        email: driverData.email,
        password: driverPassword,
        firstName: driverData.firstName,
        lastName: driverData.lastName,
        role: "driver",
        phone: driverData.phone,
        companyId: companyId,
        managerId: manager1._id, // Reference to Manager 1
        isActive: true,
      });

      await driver.save();
      console.log(
        `   - ${driverData.firstName} ${driverData.lastName} (${driverData.email})`
      );
      console.log(`     Password: ${driverData.password}`);
      console.log(`     ID: ${driver._id}`);
      console.log(`     Manager ID: ${manager1._id}`);
    }

    // 4. Create Drivers for Manager 2
    const drivers2 = [
      {
        email: "driver3@fleet.com",
        password: "driver789",
        firstName: "Frank",
        lastName: "Operator",
        phone: "+1234567895",
      },
      {
        email: "driver4@fleet.com",
        password: "driver012",
        firstName: "Grace",
        lastName: "Navigator",
        phone: "+1234567896",
      },
    ];

    console.log("\n✅ Creating drivers for Manager 2:");
    for (const driverData of drivers2) {
      const driverPassword = await bcrypt.hash(driverData.password, 10);
      const driver = new User({
        email: driverData.email,
        password: driverPassword,
        firstName: driverData.firstName,
        lastName: driverData.lastName,
        role: "driver",
        phone: driverData.phone,
        companyId: companyId,
        managerId: manager2._id, // Reference to Manager 2
        isActive: true,
      });

      await driver.save();
      console.log(
        `   - ${driverData.firstName} ${driverData.lastName} (${driverData.email})`
      );
      console.log(`     Password: ${driverData.password}`);
      console.log(`     ID: ${driver._id}`);
      console.log(`     Manager ID: ${manager2._id}`);
    }

    // 5. Verify relationships
    console.log("\n🔍 Verifying relationships:");

    // Get all users with populated manager info
    const allUsers = await User.find({ companyId }).populate(
      "managerId",
      "firstName lastName email role"
    );

    console.log("\n📊 User Hierarchy:");
    console.log("Company Owner:");
    const owner = allUsers.find((u) => u.role === "company_owner");
    console.log(`  - ${owner.firstName} ${owner.lastName} (${owner.email})`);

    console.log("\nManagers:");
    const managers = allUsers.filter((u) => u.role === "manager");
    managers.forEach((manager) => {
      console.log(
        `  - ${manager.firstName} ${manager.lastName} (${manager.email})`
      );
      const managedDrivers = allUsers.filter(
        (u) =>
          u.managerId && u.managerId._id.toString() === manager._id.toString()
      );
      console.log(`    Managed Drivers:`);
      managedDrivers.forEach((driver) => {
        console.log(
          `      * ${driver.firstName} ${driver.lastName} (${driver.email})`
        );
      });
    });

    console.log("\n✅ User hierarchy created successfully!");
    console.log("\n📝 Login Credentials Summary:");
    console.log("Company Owner: owner@fleet.com / owner123");
    console.log("Manager 1: manager1@fleet.com / manager123");
    console.log("Manager 2: manager2@fleet.com / manager456");
    console.log("Driver 1: driver1@fleet.com / driver123");
    console.log("Driver 2: driver2@fleet.com / driver456");
    console.log("Driver 3: driver3@fleet.com / driver789");
    console.log("Driver 4: driver4@fleet.com / driver012");
  } catch (error) {
    console.error("Error creating user hierarchy:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

createUserHierarchy();
