import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User, UserRole, IUser } from '../models/User';
import { Company, ICompany } from '../models/Company';

// Load environment variables
dotenv.config();

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  companyId?: string;
  managerId?: string;
}

export interface AuthResponse {
  user: IUser;
  token: string;
}

export class AuthService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

  /**
   * Register a new user
   */
  static async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);

      // Create user
      const user = new User({
        ...data,
        password: hashedPassword
      });

      await user.save();

      // Generate token
      const token = this.generateToken((user._id as any).toString());

      return {
        user: user.toJSON(),
        token
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login user
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Find user by email (include password field)
      const user = await User.findOne({ email: credentials.email }).select('+password');
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token
      const token = this.generateToken((user._id as any).toString());

      return {
        user: user.toJSON(),
        token
      };
    } catch (error) {
      throw error;
    }
  }


  /**
   * Generate JWT token
   */
  private static generateToken(userId: string): string {
    return jwt.sign(
      { userId },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN } as any
    );
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): any {
    return jwt.verify(token, this.JWT_SECRET);
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<IUser | null> {
    return await User.findById(userId).select('-password');
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email }).select('-password');
  }

  /**
   * Update user password
   */
  static async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

      // Update password
      user.password = hashedNewPassword;
      await user.save();

      return true;
    } catch (error) {
      throw error;
    }
  }
}