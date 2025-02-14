/// <reference types="jest" />

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { EnvironmentService } from '../../services/environment.service';
import { AppError } from '../../middleware/error.middleware';
import { EnvironmentData, EnvironmentHistoryEntry } from '../../types/environment.types';

// Mock Firebase Admin Firestore
const mockGet = jest.fn().mockImplementation(() => Promise.resolve());
const mockSet = jest.fn().mockImplementation(() => Promise.resolve());
const mockUpdate = jest.fn().mockImplementation(() => Promise.resolve());
const mockDoc = jest.fn(() => ({
  get: mockGet,
  set: mockSet,
  update: mockUpdate
}));
const mockCollection = jest.fn(() => ({
  doc: mockDoc
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: mockCollection
  })),
  FieldValue: {
    arrayUnion: jest.fn((data: EnvironmentHistoryEntry) => data)
  }
}));

describe('EnvironmentService', () => {
  let environmentService: EnvironmentService;
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    environmentService = new EnvironmentService();
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockGet.mockReset().mockImplementation(() => Promise.resolve());
    mockSet.mockReset().mockImplementation(() => Promise.resolve());
    mockUpdate.mockReset().mockImplementation(() => Promise.resolve());
  });

  describe('updateEnvironment', () => {
    it('should update environment data successfully', async () => {
      const mockData: Partial<EnvironmentData> = {
        temperature: 75,
        humidity: 85,
        notes: 'Test notes'
      };

      // Mock the get call for getEnvironment
      mockGet.mockImplementationOnce(() => Promise.resolve({
        exists: true,
        data: () => ({
          ...mockData,
          lastUpdate: new Date(),
          history: []
        })
      }));

      // Mock the set and update calls
      mockSet.mockImplementationOnce(() => Promise.resolve());
      mockUpdate.mockImplementationOnce(() => Promise.resolve());

      const result = await environmentService.updateEnvironment(mockUserId, mockData);

      expect(result).toHaveProperty('temperature', mockData.temperature);
      expect(result).toHaveProperty('humidity', mockData.humidity);
      expect(result).toHaveProperty('notes', mockData.notes);
      expect(result).toHaveProperty('lastUpdate');
      expect(mockSet).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should throw AppError when temperature is invalid', async () => {
      const mockData: Partial<EnvironmentData> = {
        temperature: -1,
        humidity: 85
      };

      await expect(environmentService.updateEnvironment(mockUserId, mockData))
        .rejects.toThrow(AppError);
      expect(mockSet).not.toHaveBeenCalled();
    });

    it('should throw AppError when humidity is invalid', async () => {
      const mockData: Partial<EnvironmentData> = {
        temperature: 75,
        humidity: 101
      };

      await expect(environmentService.updateEnvironment(mockUserId, mockData))
        .rejects.toThrow(AppError);
      expect(mockSet).not.toHaveBeenCalled();
    });
  });

  describe('getEnvironment', () => {
    it('should return environment data when it exists', async () => {
      const mockEnvironment: EnvironmentData = {
        temperature: 75,
        humidity: 85,
        lastUpdate: new Date(),
        notes: '',
        history: []
      };

      mockGet.mockImplementationOnce(() => Promise.resolve({
        exists: true,
        data: () => mockEnvironment
      }));

      const result = await environmentService.getEnvironment(mockUserId);

      expect(result).toEqual(mockEnvironment);
      expect(mockGet).toHaveBeenCalled();
    });

    it('should return default values when no data exists', async () => {
      mockGet.mockImplementationOnce(() => Promise.resolve({
        exists: false
      }));

      const result = await environmentService.getEnvironment(mockUserId);

      expect(result).toEqual({
        temperature: null,
        humidity: null,
        notes: '',
        lastUpdate: null,
        history: []
      });
      expect(mockGet).toHaveBeenCalled();
    });
  });

  describe('getEnvironmentHistory', () => {
    it('should return environment history', async () => {
      const mockHistory = [
        {
          timestamp: new Date(),
          temperature: 75,
          humidity: 85
        }
      ];

      mockGet.mockImplementationOnce(() => Promise.resolve({
        exists: true,
        data: () => ({ history: mockHistory })
      }));

      const result = await environmentService.getEnvironmentHistory(mockUserId);

      expect(result).toEqual(mockHistory);
      expect(mockGet).toHaveBeenCalled();
    });

    it('should return empty array when no history exists', async () => {
      mockGet.mockImplementationOnce(() => Promise.resolve({
        exists: false
      }));

      const result = await environmentService.getEnvironmentHistory(mockUserId);

      expect(result).toEqual([]);
      expect(mockGet).toHaveBeenCalled();
    });
  });
}); 