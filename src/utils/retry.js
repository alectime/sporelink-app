/**
 * Utility function to retry failed operations with exponential backoff
 * @param {Function} operation - The async operation to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxAttempts - Maximum number of retry attempts (default: 3)
 * @param {number} options.baseDelay - Base delay in milliseconds (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in milliseconds (default: 10000)
 * @returns {Promise} - Resolves with the operation result or rejects with the last error
 */
export const retry = async (operation, options = {}) => {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error);
      lastError = error;

      if (attempt === maxAttempts) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt - 1),
        maxDelay
      );

      // Add some jitter to prevent thundering herd
      const jitter = Math.random() * 100;
      
      console.log(`Retrying in ${delay + jitter}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }

  throw lastError;
}; 