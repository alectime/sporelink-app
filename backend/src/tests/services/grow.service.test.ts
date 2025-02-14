import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { GrowService } from '../../services/grow.service';
import { AppError } from '../../middleware/error.middleware';
import { DocumentData, DocumentSnapshot, QuerySnapshot, DocumentReference, Timestamp } from 'firebase-admin/firestore';

// Helper function to create mock DocumentSnapshot
const createMockDocumentSnapshot = (data: any, exists: boolean = true): DocumentSnapshot<DocumentData> => ({
  exists,
  id: data?.id || 'mock-id',
  ref: {} as DocumentReference<DocumentData>,
  readTime: Timestamp.now(),
  createTime: Timestamp.now(),
  updateTime: Timestamp.now(),
  data: () => data,
  get: (field: string) => data?.[field],
  isEqual: () => false
});

// Mock Firebase Admin Firestore
const mockGet = jest.fn().mockImplementation(() => Promise.resolve());
const mockAdd = jest.fn().mockImplementation(() => Promise.resolve({ id: 'test-id' }));
const mockUpdate = jest.fn().mockImplementation(() => Promise.resolve());
const mockDelete = jest.fn().mockImplementation(() => Promise.resolve());
const mockDoc = jest.fn(() => ({
  get: mockGet,
  update: mockUpdate,
  delete: mockDelete
}));
const mockWhere = jest.fn(() => ({
  orderBy: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve({
      docs: [] as DocumentSnapshot<DocumentData>[]
    }))
  }))
}));
const mockCollection = jest.fn(() => ({
  doc: mockDoc,
  add: mockAdd,
  where: mockWhere
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: mockCollection
  })),
  Timestamp: {
    now: () => ({
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: 0,
      toDate: () => new Date(),
      toMillis: () => Date.now(),
      isEqual: () => false
    })
  }
}));

describe('GrowService', () => {
  let growService: GrowService;
  const mockUserId = 'test-user-id';
  const mockGrowId = 'test-grow-id';

  beforeEach(() => {
    growService = new GrowService();
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockGet.mockReset().mockImplementation(() => Promise.resolve());
    mockAdd.mockReset().mockImplementation(() => Promise.resolve({ id: 'test-id' }));
    mockUpdate.mockReset().mockImplementation(() => Promise.resolve());
    mockDelete.mockReset().mockImplementation(() => Promise.resolve());
  });

  describe('createGrow', () => {
    it('should create a new grow successfully', async () => {
      const mockGrowData = {
        species: 'Test Species',
        stage: 'Inoculation',
        notes: 'Test notes'
      };

      mockAdd.mockImplementationOnce(() => Promise.resolve({
        id: mockGrowId
      }));

      const result = await growService.createGrow(mockUserId, mockGrowData);

      expect(result).toHaveProperty('id', mockGrowId);
      expect(result).toHaveProperty('species', mockGrowData.species);
      expect(result).toHaveProperty('stage', mockGrowData.stage);
      expect(result).toHaveProperty('notes', mockGrowData.notes);
      expect(result).toHaveProperty('userId', mockUserId);
      expect(mockAdd).toHaveBeenCalled();
    });

    it('should throw AppError when creation fails', async () => {
      const mockError = { code: 'auth/operation-not-allowed', message: 'Failed to create grow' };
      mockAdd.mockRejectedValueOnce(mockError);

      await expect(growService.createGrow(mockUserId, {}))
        .rejects.toThrow(AppError);
    });
  });

  describe('getGrows', () => {
    it('should return all grows for a user', async () => {
      const mockGrows = [
        { id: 'grow1', species: 'Species 1' },
        { id: 'grow2', species: 'Species 2' }
      ];

      const mockGetDocs = jest.fn(() => Promise.resolve({
        docs: mockGrows.map(grow => createMockDocumentSnapshot(grow))
      } as QuerySnapshot<DocumentData>));

      mockWhere.mockImplementationOnce(() => ({
        orderBy: jest.fn(() => ({
          get: mockGetDocs
        }))
      }));

      const result = await growService.getGrows(mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id', 'grow1');
      expect(result[1]).toHaveProperty('id', 'grow2');
      expect(mockWhere).toHaveBeenCalledWith('userId', '==', mockUserId);
    });

    it('should throw AppError when fetching fails', async () => {
      mockWhere.mockImplementationOnce(() => ({
        orderBy: jest.fn(() => ({
          get: jest.fn(() => Promise.reject(new Error('Failed to fetch grows')))
        }))
      }));

      await expect(growService.getGrows(mockUserId))
        .rejects.toThrow(AppError);
    });
  });

  describe('getGrowById', () => {
    it('should return a specific grow', async () => {
      const mockGrow = {
        id: mockGrowId,
        species: 'Test Species',
        userId: mockUserId
      };

      mockGet.mockImplementationOnce(() => Promise.resolve(
        createMockDocumentSnapshot(mockGrow)
      ));

      const result = await growService.getGrowById(mockGrowId, mockUserId);

      expect(result).toHaveProperty('id', mockGrowId);
      expect(result).toHaveProperty('species', mockGrow.species);
      expect(mockGet).toHaveBeenCalled();
    });

    it('should throw AppError when grow not found', async () => {
      mockGet.mockImplementationOnce(() => Promise.resolve(
        createMockDocumentSnapshot(null, false)
      ));

      await expect(growService.getGrowById(mockGrowId, mockUserId))
        .rejects.toThrow(AppError);
    });

    it('should throw AppError when user is not authorized', async () => {
      mockGet.mockImplementationOnce(() => Promise.resolve(
        createMockDocumentSnapshot({
          userId: 'different-user-id'
        })
      ));

      await expect(growService.getGrowById(mockGrowId, mockUserId))
        .rejects.toThrow(AppError);
    });
  });
}); 