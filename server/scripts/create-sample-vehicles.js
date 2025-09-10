const mongoose = require("mongoose");
require("dotenv").config();

// Vehicle schema (simplified for script)
const vehicleSchema = new mongoose.Schema({
  licensePlate: { type: String, required: true, unique: true },
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  vin: { type: String, required: true, unique: true },
  nextServiceDate: { type: Date, required: true },
  odometer: { type: Number, required: true },
  status: {
    type: String,
    enum: ["active", "maintenance", "out_of_service"],
    default: "active",
  },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  companyId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: {
    type: String,
    enum: ["admin", "manager", "driver"],
    default: "driver",
  },
  isActive: { type: Boolean, default: true },
  phone: String,
  companyId: String,
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
const User = mongoose.model("User", userSchema);

async function createSampleVehicles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/fleet-management"
    );
    console.log("Connected to MongoDB");

    // Get existing users
    const users = await User.find({ isActive: true });
    const admin = users.find((u) => u.role === "admin");
    const managers = users.filter((u) => u.role === "manager");
    const drivers = users.filter((u) => u.role === "driver");

    if (!admin) {
      console.log("No admin found. Please run create-new-hierarchy.js first.");
      return;
    }

    const companyId = admin.companyId;

    // Sample vehicles data
    const vehiclesData = [
      {
        licensePlate: "ABC-123",
        make: "Ford",
        model: "Transit",
        year: 2022,
        vin: "1FTBW2CMXNKA12345",
        nextServiceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        odometer: 25000,
        status: "active",
        driverId: drivers[0]?._id,
      },
      {
        licensePlate: "XYZ-789",
        make: "Chevrolet",
        model: "Express",
        year: 2021,
        vin: "1GCGSCEN1MZ123456",
        nextServiceDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        odometer: 45000,
        status: "active",
        driverId: drivers[1]?._id,
      },
      {
        licensePlate: "DEF-456",
        make: "Mercedes",
        model: "Sprinter",
        year: 2023,
        vin: "WDB9066371L123456",
        nextServiceDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        odometer: 12000,
        status: "active",
        driverId: drivers[2]?._id,
      },
      {
        licensePlate: "GHI-789",
        make: "Ford",
        model: "E-Series",
        year: 2020,
        vin: "1FTSE3EL2LKA12345",
        nextServiceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days overdue
        odometer: 75000,
        status: "maintenance",
        driverId: drivers[3]?._id,
      },
      {
        licensePlate: "JKL-012",
        make: "Ram",
        model: "ProMaster",
        year: 2021,
        vin: "3C6TRVAG8ME123456",
        nextServiceDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        odometer: 38000,
        status: "active",
        // No driver assigned
      },
    ];

    console.log("Creating sample vehicles...");

    for (const vehicleData of vehiclesData) {
      const vehicle = new Vehicle({
        ...vehicleData,
        companyId: companyId,
      });

      await vehicle.save();
      console.log(
        `✅ Created vehicle: ${vehicleData.year} ${vehicleData.make} ${vehicleData.model} (${vehicleData.licensePlate})`
      );

      if (vehicleData.driverId) {
        const driver = drivers.find(
          (d) => d._id.toString() === vehicleData.driverId.toString()
        );
        console.log(`   Assigned to: ${driver?.firstName} ${driver?.lastName}`);
      } else {
        console.log(`   Unassigned`);
      }
    }

    // Verify assignments
    console.log("\n🔍 Verifying vehicle assignments:");
    const vehicles = await Vehicle.find({ companyId }).populate(
      "driverId",
      "firstName lastName email"
    );

    vehicles.forEach((vehicle) => {
      const driverName = vehicle.driverId
        ? `${vehicle.driverId.firstName} ${vehicle.driverId.lastName}`
        : "Unassigned";
      console.log(
        `- ${vehicle.licensePlate}: ${vehicle.year} ${vehicle.make} ${vehicle.model} → ${driverName}`
      );
    });

    console.log("\n✅ Sample vehicles created successfully!");
  } catch (error) {
    console.error("Error creating sample vehicles:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

createSampleVehicles();
