const mongoose = require("mongoose");
const { NotificationService } = require("../dist/services/NotificationService");
const { User } = require("../dist/models/User");
require("dotenv").config();

async function testPushNotifications() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/fleet-management"
    );
    console.log("✅ Connected to MongoDB");

    // Find a test driver
    const testDriver = await User.findOne({ role: "driver" });
    if (!testDriver) {
      console.log("❌ No driver found. Please create a driver user first.");
      return;
    }

    console.log(
      `\n📱 Testing push notifications for driver: ${testDriver.firstName} ${testDriver.lastName}`
    );
    console.log(`📧 Email: ${testDriver.email}`);
    console.log(
      `🔑 FCM Token: ${testDriver.fcmToken ? "✅ Registered" : "❌ Not registered"}`
    );

    if (!testDriver.fcmToken) {
      console.log("\n⚠️  No FCM token found. This means:");
      console.log(
        "   1. The Android app hasn't been installed and logged in yet"
      );
      console.log("   2. Or the FCM token registration failed");
      console.log("   3. The notification will be saved to database only");
    }

    // Test 1: Send info notification
    console.log("\n🧪 Test 1: Sending info notification...");
    try {
      const notification1 = await NotificationService.sendPushNotification(
        testDriver._id.toString(),
        "Test Push Notification",
        "This is a test push notification from the server!",
        "info"
      );
      console.log("✅ Info notification sent:", notification1._id);
    } catch (error) {
      console.log("❌ Info notification failed:", error.message);
    }

    // Test 2: Send warning notification
    console.log("\n🧪 Test 2: Sending warning notification...");
    try {
      const notification2 = await NotificationService.sendPushNotification(
        testDriver._id.toString(),
        "Important Alert",
        "Please check your vehicle before starting your next trip.",
        "warning"
      );
      console.log("✅ Warning notification sent:", notification2._id);
    } catch (error) {
      console.log("❌ Warning notification failed:", error.message);
    }

    // Test 3: Send to all drivers
    console.log("\n🧪 Test 3: Sending to all drivers...");
    try {
      const notifications =
        await NotificationService.sendPushNotificationToCompany(
          testDriver.companyId,
          "Company Announcement",
          "This is a company-wide announcement for all drivers.",
          "info"
        );
      console.log(
        `✅ Company notification sent to ${notifications.length} driver(s)`
      );
    } catch (error) {
      console.log("❌ Company notification failed:", error.message);
    }

    console.log("\n🎉 Push notification tests completed!");
    console.log("\n📋 Next steps:");
    console.log("1. Install the Android app on a device/emulator");
    console.log("2. Log in with the test driver credentials");
    console.log("3. Check if notifications appear on the device");
    console.log("4. Check the web app Notifications page");
    console.log(
      "5. If no push notifications appear, follow FIREBASE_PUSH_SETUP.md"
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

// Run the test
testPushNotifications();
