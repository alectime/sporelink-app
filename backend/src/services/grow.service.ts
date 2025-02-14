import { getFirestore } from 'firebase-admin/firestore';
import { AppError } from '../middleware/error.middleware';

export class GrowService {
  private db = getFirestore();
  private growsCollection = 'grows';

  async createGrow(userId: string, growData: any) {
    try {
      const grow = {
        ...growData,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        history: [{
          timestamp: new Date(),
          stage: growData.stage,
          notes: growData.notes || '',
        }]
      };

      const docRef = await this.db.collection(this.growsCollection).add(grow);
      return { id: docRef.id, ...grow };
    } catch (error) {
      throw new AppError(500, 'Error creating grow');
    }
  }

  async getGrows(userId: string) {
    try {
      const snapshot = await this.db.collection(this.growsCollection)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new AppError(500, 'Error fetching grows');
    }
  }

  async getGrowById(growId: string, userId: string) {
    try {
      const doc = await this.db.collection(this.growsCollection).doc(growId).get();
      
      if (!doc.exists) {
        throw new AppError(404, 'Grow not found');
      }

      const grow = doc.data();
      if (grow?.userId !== userId) {
        throw new AppError(403, 'Not authorized to access this grow');
      }

      return { id: doc.id, ...grow };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Error fetching grow');
    }
  }

  async updateGrow(growId: string, userId: string, updateData: any) {
    try {
      const growRef = this.db.collection(this.growsCollection).doc(growId);
      const doc = await growRef.get();

      if (!doc.exists) {
        throw new AppError(404, 'Grow not found');
      }

      const grow = doc.data();
      if (grow?.userId !== userId) {
        throw new AppError(403, 'Not authorized to update this grow');
      }

      const newHistoryEntry = {
        timestamp: new Date(),
        stage: updateData.stage,
        notes: updateData.notes || '',
        temperature: updateData.temperature,
        humidity: updateData.humidity
      };

      const update = {
        ...updateData,
        updatedAt: new Date(),
        history: [...(grow?.history || []), newHistoryEntry]
      };

      await growRef.update(update);
      return { id: growId, ...doc.data(), ...update };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Error updating grow');
    }
  }

  async deleteGrow(growId: string, userId: string) {
    try {
      const doc = await this.db.collection(this.growsCollection).doc(growId).get();
      
      if (!doc.exists) {
        throw new AppError(404, 'Grow not found');
      }

      const grow = doc.data();
      if (grow?.userId !== userId) {
        throw new AppError(403, 'Not authorized to delete this grow');
      }

      await doc.ref.delete();
      return true;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Error deleting grow');
    }
  }
} 