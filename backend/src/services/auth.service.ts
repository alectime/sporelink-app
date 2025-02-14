import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { AppError } from '../middleware/error.middleware';

export class AuthService {
  private auth = getAuth();
  private db = getFirestore();

  async createUser(email: string, password: string, userData: any) {
    try {
      const userRecord = await this.auth.createUser({
        email,
        password,
        emailVerified: false,
        disabled: false,
      });

      // Create user profile in Firestore
      await this.db.collection('users').doc(userRecord.uid).set({
        ...userData,
        email: userRecord.email,
        createdAt: new Date(),
        lastLogin: new Date(),
      });

      return userRecord;
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        throw new AppError(400, 'Email already in use');
      }
      throw new AppError(500, 'Error creating user');
    }
  }

  async verifyToken(token: string) {
    try {
      const decodedToken = await this.auth.verifyIdToken(token);
      return decodedToken;
    } catch (error) {
      throw new AppError(401, 'Invalid or expired token');
    }
  }

  async getUserProfile(userId: string) {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw new AppError(404, 'User profile not found');
      }
      return userDoc.data();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Error fetching user profile');
    }
  }

  async updateUserProfile(userId: string, updateData: any) {
    try {
      await this.db.collection('users').doc(userId).update({
        ...updateData,
        updatedAt: new Date(),
      });
      return true;
    } catch (error) {
      throw new AppError(500, 'Error updating user profile');
    }
  }

  async deleteUser(userId: string) {
    try {
      await this.auth.deleteUser(userId);
      await this.db.collection('users').doc(userId).delete();
      return true;
    } catch (error) {
      throw new AppError(500, 'Error deleting user');
    }
  }
} 