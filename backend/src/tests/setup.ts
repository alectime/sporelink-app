import { config } from 'dotenv';
import { initializeApp } from 'firebase-admin/app';

// Load environment variables
config({ path: '.env.test' });

// Initialize Firebase Admin with test credentials
initializeApp({
  projectId: 'test-project',
  credential: {
    getAccessToken: () => Promise.resolve({
      access_token: 'test-token',
      expires_in: 3600
    })
  }
}); 