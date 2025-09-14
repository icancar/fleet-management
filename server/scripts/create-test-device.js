const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/fleet-management",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const Device = require("../dist/models/Device").Device;
const User = require("../dist/models/User").User;

async function createTestDevice() {
  try {
    // Find the driver user
    const driver = await User.findOne({ email: "driver@fleetmanagement.com" });
    if (!driver) {
      console.log("Driver not found");
      return;
    }

    console.log("Found driver:", driver.email, "ID:", driver._id);

    // Create a test device for the driver
    const testDevice = new Device({
      deviceId: "TEST_DRIVER_DEVICE",
      deviceFingerprint: "TEST_FINGERPRINT",
      manufacturer: "Test",
      deviceModel: "Test Device",
      androidVersion: "11",
      userId: driver._id.toString(),
      isActive: true,
      totalLocations: 0,
    });

    await testDevice.save();
    console.log("Test device created for driver:", testDevice.deviceId);

    // Also create some test location data
    const LocationLog = require("../dist/models/LocationLog").LocationLog;

    const testLocations = [
      {
        deviceId: "TEST_DRIVER_DEVICE",
        userId: driver._id.toString(),
        latitude: 44.7865,
        longitude: 20.4489,
        accuracy: 10,
        timestamp: new Date("2025-09-14T10:00:00Z"),
        speed: 0,
        bearing: 0,
        altitude: 100,
      },
      {
        deviceId: "TEST_DRIVER_DEVICE",
        userId: driver._id.toString(),
        latitude: 44.787,
        longitude: 20.4495,
        accuracy: 10,
        timestamp: new Date("2025-09-14T10:05:00Z"),
        speed: 5,
        bearing: 45,
        altitude: 100,
      },
      {
        deviceId: "TEST_DRIVER_DEVICE",
        userId: driver._id.toString(),
        latitude: 44.7875,
        longitude: 20.45,
        accuracy: 10,
        timestamp: new Date("2025-09-14T10:10:00Z"),
        speed: 8,
        bearing: 90,
        altitude: 100,
      },
    ];

    for (const location of testLocations) {
      const locationLog = new LocationLog(location);
      await locationLog.save();
    }

    console.log("Test location data created");

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

createTestDevice();
