import admin from 'firebase-admin';
import path from 'path';
import { Notification, INotification } from '../models/Notification';
import { User } from '../models/User';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // Try to use service account key file first
    const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
    const serviceAccount = require(serviceAccountPath);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    
    console.log('✅ Firebase Admin SDK initialized with service account key');
  } catch (error) {
    // Fallback to default credentials (for development)
    console.log('⚠️  Service account key not found, using default credentials');
    console.log('📝 To enable push notifications, follow FIREBASE_PUSH_SETUP.md');
    
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
}

export class NotificationService {
  
  // Send push notification to a specific user
  static async sendPushNotification(
    userId: string,
    title: string,
    message: string,
    type: string = 'info'
  ): Promise<INotification> {
    try {
      // Get user's FCM token
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Create notification in database first
      const notification = await Notification.createNotification({
        title,
        message,
        type: type as any,
        userId
      });

      // Only send push notification if FCM token is available
      if (user.fcmToken) {
        try {
          const payload = {
            notification: {
              title,
              body: message,
            },
            data: {
              title,
              body: message,
              type,
              notificationId: notification._id.toString()
            },
            token: user.fcmToken
          };

          console.log(`🚀 Sending FCM notification to user ${userId} (${user.email})`);
          console.log(`📱 FCM Token: ${user.fcmToken.substring(0, 20)}...`);
          console.log(`📋 Payload:`, JSON.stringify(payload, null, 2));

          const result = await admin.messaging().send(payload);
          console.log(`✅ Push notification sent successfully to user ${userId}:`, result);
        } catch (fcmError) {
          console.error(`❌ Failed to send FCM notification to user ${userId}:`, fcmError);
          console.error(`📋 FCM Error details:`, fcmError instanceof Error ? fcmError.message : String(fcmError));
          // Don't throw error - notification is still saved to database
        }
      } else {
        console.log(`⚠️ No FCM token for user ${userId}, notification saved to database only`);
      }

      return notification;
    } catch (error) {
      console.error('Error in sendPushNotification:', error);
      throw error;
    }
  }

  // Send push notification to multiple users
  static async sendPushNotificationToMultiple(
    userIds: string[],
    title: string,
    message: string,
    type: string = 'info'
  ): Promise<INotification[]> {
    try {
      const notifications: INotification[] = [];
      
      for (const userId of userIds) {
        try {
          const notification = await this.sendPushNotification(
            userId,
            title,
            message,
            type
          );
          notifications.push(notification);
        } catch (error) {
          console.error(`Failed to send notification to user ${userId}:`, error);
          // Continue with other users even if one fails
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error sending push notifications to multiple users:', error);
      throw error;
    }
  }

  // Send push notification to all drivers in a company
  static async sendPushNotificationToCompany(
    companyId: string,
    title: string,
    message: string,
    type: string = 'info'
  ): Promise<INotification[]> {
    try {
      // Find all drivers in the company (regardless of FCM token status)
      const drivers = await User.find({ 
        companyId: companyId, 
        role: 'driver'
      });

      if (drivers.length === 0) {
        console.log('No drivers found in company:', companyId);
        return [];
      }

      const notifications: INotification[] = [];
      
      for (const driver of drivers) {
        try {
          // Create notification in database first
          const notification = await Notification.createNotification({
            title,
            message,
            type: type as any,
            userId: (driver._id as any).toString()
          });

          // Only send push notification if FCM token is available
          if (driver.fcmToken) {
            try {
              const payload = {
                notification: {
                  title,
                  body: message,
                },
                data: {
                  title,
                  body: message,
                  type,
                  notificationId: notification._id.toString()
                },
                token: driver.fcmToken
              };

              await admin.messaging().send(payload);
              console.log(`Push notification sent to driver ${driver._id}`);
            } catch (fcmError) {
              console.error(`Failed to send FCM notification to driver ${driver._id}:`, fcmError);
              // Don't throw error - notification is still saved to database
            }
          } else {
            console.log(`No FCM token for driver ${driver._id}, notification saved to database only`);
          }

          notifications.push(notification);
        } catch (error) {
          console.error(`Failed to create notification for driver ${driver._id}:`, error);
          // Continue with other drivers even if one fails
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error sending push notifications to company:', error);
      throw error;
    }
  }

  // Update user's FCM token
  static async updateFCMToken(userId: string, fcmToken: string): Promise<void> {
    try {
      await User.findByIdAndUpdate(userId, { fcmToken });
    } catch (error) {
      console.error('Error updating FCM token:', error);
      throw error;
    }
  }

  // Remove user's FCM token
  static async removeFCMToken(userId: string): Promise<void> {
    try {
      await User.findByIdAndUpdate(userId, { $unset: { fcmToken: 1 } });
    } catch (error) {
      console.error('Error removing FCM token:', error);
      throw error;
    }
  }
}
