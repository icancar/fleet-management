const admin = require("firebase-admin");
const path = require("path");
require("dotenv").config();

async function testFirebase() {
  try {
    console.log("🔧 Testing Firebase configuration...");

    // Check if service account key exists
    const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
    console.log("📁 Service account path:", serviceAccountPath);

    const serviceAccount = require(serviceAccountPath);
    console.log("✅ Service account key loaded");
    console.log("📋 Project ID:", serviceAccount.project_id);

    // Initialize Firebase
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }

    console.log("✅ Firebase Admin SDK initialized");

    // Test with a real FCM token (if available)
    const mongoose = require("mongoose");
    const { User } = require("./dist/models/User");

    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/fleet-management"
    );
    console.log("✅ Connected to MongoDB");

    const userWithToken = await User.findOne({
      fcmToken: { $exists: true, $ne: null },
    });
    if (userWithToken) {
      console.log("📱 Found user with FCM token:", userWithToken.email);
      console.log(
        "🔑 Token (first 20 chars):",
        userWithToken.fcmToken.substring(0, 20) + "..."
      );

      // Test sending a real notification
      console.log("🧪 Testing real FCM notification...");
      try {
        const result = await admin.messaging().send({
          notification: {
            title: "Firebase Test",
            body: "This is a test notification from Firebase Admin SDK",
          },
          token: userWithToken.fcmToken,
        });
        console.log("✅ FCM notification sent successfully:", result);
      } catch (fcmError) {
        console.log("❌ FCM error:", fcmError.message);
        console.log("📋 Error details:", fcmError);
      }
    } else {
      console.log("❌ No user with FCM token found");
    }

    await mongoose.disconnect();
  } catch (error) {
    console.log("❌ Error:", error.message);
    console.log("📋 Full error:", error);
  }
}

testFirebase();
