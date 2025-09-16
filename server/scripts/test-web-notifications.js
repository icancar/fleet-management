const mongoose = require("mongoose");
const { NotificationService } = require("../dist/services/NotificationService");
const { User } = require("../dist/models/User");
require("dotenv").config();

async function testWebNotifications() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/fleet-management"
    );
    console.log("Connected to MongoDB");

    // Find a test user
    const testUser = await User.findOne({ role: "driver" });
    if (!testUser) {
      console.log("No test user found. Please create a driver user first.");
      return;
    }

    console.log(`Testing web notifications for user: ${testUser.email}`);

    // Test 1: Send a simple notification
    console.log("\n1. Testing simple notification...");
    const notification1 = await NotificationService.sendPushNotification(
      testUser._id.toString(),
      "Welcome to Fleet Management",
      "You can now view your notifications in the web app by clicking on 'Notifications' in the menu.",
      "info"
    );
    console.log("✅ Simple notification sent:", notification1._id);

    // Test 2: Send warning notification
    console.log("\n2. Testing warning notification...");
    const notification2 = await NotificationService.sendPushNotification(
      testUser._id.toString(),
      "System Maintenance",
      "The system will be under maintenance tonight from 2 AM to 4 AM. Please plan accordingly.",
      "warning"
    );
    console.log("✅ Warning notification sent:", notification2._id);

    // Test 3: Send success notification
    console.log("\n3. Testing success notification...");
    const notification3 = await NotificationService.sendPushNotification(
      testUser._id.toString(),
      "Profile Updated",
      "Your profile has been successfully updated with the latest information.",
      "success"
    );
    console.log("✅ Success notification sent:", notification3._id);

    // Test 4: Send error notification
    console.log("\n4. Testing error notification...");
    const notification4 = await NotificationService.sendPushNotification(
      testUser._id.toString(),
      "Location Service Issue",
      "There was an issue with your location tracking. Please restart the app to resolve this.",
      "error"
    );
    console.log("✅ Error notification sent:", notification4._id);

    // Test 5: Get user notifications
    console.log("\n5. Testing notification retrieval...");
    const notifications =
      await NotificationService.Notification.getUserNotifications(
        testUser._id.toString(),
        1,
        10
      );
    console.log(`✅ Retrieved ${notifications.length} notifications for user`);

    // Test 6: Get unread count
    console.log("\n6. Testing unread count...");
    const unreadCount = await NotificationService.Notification.getUnreadCount(
      testUser._id.toString()
    );
    console.log(`✅ Unread notifications: ${unreadCount}`);

    console.log("\n🎉 All web notification tests completed successfully!");
    console.log("\nTo test web notifications:");
    console.log("1. Log in to the web app with the test user credentials");
    console.log("2. Go to 'Notifications' in the navigation menu");
    console.log("3. You should see all the test notifications");
    console.log("4. Try marking notifications as read");
    console.log("5. Check the notification badge in the navigation");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

// Run the test
testWebNotifications();
