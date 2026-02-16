// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 10000,
  forceExit: true,
  clearMocks: true,
  maxWorkers: 1,  // ← ADD THIS LINE
};