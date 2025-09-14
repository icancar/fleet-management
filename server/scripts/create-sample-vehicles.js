const mongoose = require("mongoose");

// Connect to MongoDB
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/fleet-management";

async function createSampleVehicles() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Define the Vehicle schema (simplified version for this script)
    const VehicleSchema = new mongoose.Schema(
      {
        licensePlate: {
          type: String,
          required: true,
          unique: true,
          trim: true,
          uppercase: true,
        },
        make: {
          type: String,
          required: true,
          trim: true,
        },
        vehicleModel: {
          type: String,
          required: true,
          trim: true,
        },
        year: {
          type: Number,
          required: true,
          min: 1900,
          max: new Date().getFullYear() + 1,
        },
        vin: {
          type: String,
          required: true,
          unique: true,
          trim: true,
          uppercase: true,
        },
        nextServiceDate: {
          type: Date,
          required: true,
        },
        odometer: {
          type: Number,
          required: true,
          min: 0,
        },
        status: {
          type: String,
          enum: ["active", "maintenance", "out_of_service"],
          default: "active",
        },
        driverId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: false,
        },
        companyId: {
          type: String,
          required: false,
        },
      },
      {
        timestamps: true,
      }
    );

    const Vehicle = mongoose.model("Vehicle", VehicleSchema);

    // Get the driver user to assign some vehicles
    const User = mongoose.model(
      "User",
      new mongoose.Schema({}, { strict: false })
    );
    const driver = await User.findOne({ email: "driver@fleetmanagement.com" });

    if (!driver) {
      console.log("❌ Driver user not found. Please create driver first.");
      process.exit(1);
    }

    // Sample vehicles data
    const vehicles = [
      {
        licensePlate: "ABC-123",
        make: "Toyota",
        vehicleModel: "Camry",
        year: 2022,
        vin: "1HGBH41JXMN109186",
        nextServiceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        odometer: 25000,
        status: "active",
        driverId: driver._id,
      },
      {
        licensePlate: "XYZ-789",
        make: "Ford",
        vehicleModel: "Transit",
        year: 2021,
        vin: "1FTBW2CM5HKA12345",
        nextServiceDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        odometer: 45000,
        status: "active",
        driverId: driver._id,
      },
      {
        licensePlate: "DEF-456",
        make: "Chevrolet",
        vehicleModel: "Silverado",
        year: 2023,
        vin: "1GCUYDED2PZ123456",
        nextServiceDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        odometer: 12000,
        status: "active",
        // No driver assigned
      },
      {
        licensePlate: "GHI-321",
        make: "Nissan",
        vehicleModel: "NV200",
        year: 2020,
        vin: "1N6BD0CT5LN123456",
        nextServiceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days overdue
        odometer: 78000,
        status: "maintenance",
        // No driver assigned
      },
      {
        licensePlate: "JKL-654",
        make: "Mercedes-Benz",
        vehicleModel: "Sprinter",
        year: 2022,
        vin: "WDB9066321LA12345",
        nextServiceDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        odometer: 32000,
        status: "active",
        driverId: driver._id,
      },
      {
        licensePlate: "MNO-987",
        make: "Volkswagen",
        vehicleModel: "Crafter",
        year: 2021,
        vin: "WV2ZZZ7HZMH123456",
        nextServiceDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        odometer: 55000,
        status: "active",
        // No driver assigned
      },
    ];

    // Check if vehicles already exist
    const existingVehicles = await Vehicle.find({
      licensePlate: { $in: vehicles.map((v) => v.licensePlate) },
    });

    if (existingVehicles.length > 0) {
      console.log("❌ Some vehicles already exist. Skipping creation.");
      console.log(
        "Existing vehicles:",
        existingVehicles.map((v) => v.licensePlate)
      );
      process.exit(0);
    }

    // Create vehicles
    const createdVehicles = await Vehicle.insertMany(vehicles);

    console.log("✅ Sample vehicles created successfully!");
    console.log(`📊 Created ${createdVehicles.length} vehicles:`);

    createdVehicles.forEach((vehicle) => {
      const driverInfo = vehicle.driverId
        ? " (Assigned to driver)"
        : " (Unassigned)";
      console.log(
        `   🚗 ${vehicle.licensePlate} - ${vehicle.year} ${vehicle.make} ${vehicle.vehicleModel}${driverInfo}`
      );
    });
  } catch (error) {
    console.error("❌ Error creating sample vehicles:", error);
  } finally {
    await mongoose.disconnect();
    console.log("📊 Disconnected from MongoDB");
  }
}

createSampleVehicles();
