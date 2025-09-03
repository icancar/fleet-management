const { MongoClient } = require("mongodb");

async function checkMongoDBData() {
  const client = new MongoClient("mongodb://localhost:27017");

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB successfully!");

    const db = client.db("fleet-management");

    // Check if database exists and list collections
    const collections = await db.listCollections().toArray();
    console.log("\n📊 Collections in fleet-management database:");
    if (collections.length === 0) {
      console.log(
        "   No collections found yet. Start your Android app to create data!"
      );
    } else {
      collections.forEach((col) => console.log(`   - ${col.name}`));
    }

    // Count documents in each collection
    const locationCount = await db.collection("locationlogs").countDocuments();
    const deviceCount = await db.collection("devices").countDocuments();

    console.log(`\n📈 Data Summary:`);
    console.log(`   📍 Location logs: ${locationCount}`);
    console.log(`   📱 Devices: ${deviceCount}`);

    // Show recent locations if any exist
    if (locationCount > 0) {
      console.log("\n🔄 Recent location data:");
      const recent = await db
        .collection("locationlogs")
        .find()
        .sort({ createdAt: -1 })
        .limit(3)
        .toArray();

      recent.forEach((loc, i) => {
        console.log(`   ${i + 1}. Device: ${loc.deviceId}`);
        console.log(`      Location: ${loc.latitude}, ${loc.longitude}`);
        console.log(`      Time: ${new Date(loc.timestamp).toLocaleString()}`);
        console.log(`      Speed: ${loc.speed} m/s`);
        console.log("");
      });
    }

    // Show devices if any exist
    if (deviceCount > 0) {
      console.log("📱 Registered devices:");
      const devices = await db.collection("devices").find().toArray();
      devices.forEach((device) => {
        console.log(`   - ${device.deviceId}`);
        console.log(`     Total locations: ${device.totalLocations}`);
        console.log(
          `     Last seen: ${new Date(device.lastSeen).toLocaleString()}`
        );
        console.log("");
      });
    }

    if (locationCount === 0 && deviceCount === 0) {
      console.log("\n🚀 Ready to receive data!");
      console.log("   Start your Android app and begin location tracking.");
      console.log("   Data will appear here automatically.");
    }
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("   1. Make sure MongoDB is running: ps aux | grep mongod");
    console.log("   2. Check if port 27017 is open: lsof -i :27017");
    console.log(
      "   3. Check MongoDB logs: tail -f /usr/local/var/log/mongodb/mongo.log"
    );
  } finally {
    await client.close();
  }
}

checkMongoDBData();
