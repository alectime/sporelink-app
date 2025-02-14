import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { AppError } from '../middleware/error.middleware';
import { EnvironmentData, EnvironmentHistoryEntry } from '../types/environment.types';

export class EnvironmentService {
  private db = getFirestore();
  private readonly collection = 'environments';

  async updateEnvironment(userId: string, data: Partial<EnvironmentData>): Promise<EnvironmentData> {
    // Validate temperature and humidity
    if (data.temperature !== undefined && data.temperature !== null && 
        (data.temperature < 0 || data.temperature > 100)) {
      throw new AppError(400, 'Temperature must be between 0 and 100°F');
    }
    if (data.humidity !== undefined && data.humidity !== null && 
        (data.humidity < 0 || data.humidity > 100)) {
      throw new AppError(400, 'Humidity must be between 0 and 100%');
    }

    const lastUpdate = new Date();
    const updateData: Partial<EnvironmentData> = {
      ...data,
      lastUpdate
    };

    // Create history entry if temperature or humidity is updated
    if ((data.temperature !== undefined && data.temperature !== null) || 
        (data.humidity !== undefined && data.humidity !== null)) {
      const historyEntry: EnvironmentHistoryEntry = {
        timestamp: lastUpdate,
        temperature: data.temperature ?? 0,
        humidity: data.humidity ?? 0
      };
      await this.db.collection(this.collection).doc(userId).update({
        history: FieldValue.arrayUnion(historyEntry)
      });
    }

    await this.db.collection(this.collection).doc(userId).set(updateData, { merge: true });

    return this.getEnvironment(userId);
  }

  async getEnvironment(userId: string): Promise<EnvironmentData> {
    const doc = await this.db.collection(this.collection).doc(userId).get();
    
    if (!doc.exists) {
      return {
        temperature: null,
        humidity: null,
        notes: '',
        lastUpdate: null,
        history: []
      };
    }

    return doc.data() as EnvironmentData;
  }

  async getEnvironmentHistory(userId: string): Promise<EnvironmentHistoryEntry[]> {
    const doc = await this.db.collection(this.collection).doc(userId).get();
    
    if (!doc.exists) {
      return [];
    }

    const data = doc.data();
    return data?.history || [];
  }
} 