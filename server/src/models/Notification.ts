import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  userId: string;
  isRead: boolean;
  sentAt: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    required: true,
    enum: ['info', 'warning', 'error', 'success'],
    default: 'info'
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ type: 1, sentAt: -1 });

// Virtual for formatted creation date
NotificationSchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt.toISOString();
});

// Method to mark as read
NotificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to create notification
NotificationSchema.statics.createNotification = async function(notificationData: Partial<INotification>) {
  const notification = new this(notificationData);
  return await notification.save();
};

// Static method to get unread count for user
NotificationSchema.statics.getUnreadCount = async function(userId: string) {
  return await this.countDocuments({ userId, isRead: false });
};

// Static method to get notifications for user with pagination
NotificationSchema.statics.getUserNotifications = async function(
  userId: string, 
  page: number = 1, 
  limit: number = 20,
  type?: string
) {
  const query: any = { userId };
  if (type) {
    query.type = type;
  }

  const skip = (page - 1) * limit;
  
  return await this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name email');
};

// Interface for static methods
interface NotificationModel extends mongoose.Model<INotification> {
  createNotification(notificationData: Partial<INotification>): Promise<INotification>;
  getUnreadCount(userId: string): Promise<number>;
  getUserNotifications(userId: string, page?: number, limit?: number, type?: string): Promise<INotification[]>;
}

export const Notification = mongoose.model<INotification, NotificationModel>('Notification', NotificationSchema);
