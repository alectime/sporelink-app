import { AuthService } from '../../services/auth.service';
import { AppError } from '../../middleware/error.middleware';

// Mock Firebase Admin Auth
jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    createUser: jest.fn(),
    verifyIdToken: jest.fn(),
    deleteUser: jest.fn()
  }))
}));

// Mock Firebase Admin Firestore
jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn(),
        get: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      }))
    }))
  }))
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const mockUserData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const mockUserRecord = {
        uid: 'test-uid',
        email: mockUserData.email
      };

      const createUserMock = require('firebase-admin/auth').getAuth().createUser;
      createUserMock.mockResolvedValueOnce(mockUserRecord);

      const result = await authService.createUser(
        mockUserData.email,
        mockUserData.password,
        { name: mockUserData.name }
      );

      expect(result).toEqual(mockUserRecord);
      expect(createUserMock).toHaveBeenCalledWith({
        email: mockUserData.email,
        password: mockUserData.password,
        emailVerified: false,
        disabled: false
      });
    });

    it('should throw AppError when email already exists', async () => {
      const createUserMock = require('firebase-admin/auth').getAuth().createUser;
      createUserMock.mockRejectedValueOnce({ code: 'auth/email-already-exists' });

      await expect(authService.createUser(
        'existing@example.com',
        'password123',
        {}
      )).rejects.toThrow(AppError);
    });
  });

  describe('verifyToken', () => {
    it('should verify token successfully', async () => {
      const mockDecodedToken = {
        uid: 'test-uid',
        email: 'test@example.com'
      };

      const verifyIdTokenMock = require('firebase-admin/auth').getAuth().verifyIdToken;
      verifyIdTokenMock.mockResolvedValueOnce(mockDecodedToken);

      const result = await authService.verifyToken('valid-token');

      expect(result).toEqual(mockDecodedToken);
      expect(verifyIdTokenMock).toHaveBeenCalledWith('valid-token');
    });

    it('should throw AppError when token is invalid', async () => {
      const verifyIdTokenMock = require('firebase-admin/auth').getAuth().verifyIdToken;
      verifyIdTokenMock.mockRejectedValueOnce(new Error('Invalid token'));

      await expect(authService.verifyToken('invalid-token'))
        .rejects.toThrow(AppError);
    });
  });
}); 