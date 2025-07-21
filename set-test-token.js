// Test JWT token generated from backend/create-test-token.js
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzUyNjAwMTY2LCJleHAiOjE3NTI2ODY1NjZ9.L2oBccqLMEXygd6QwWqEvVoQqqiPck8ASO7mSlAi-1I';

// Test user object
const testUser = {
  userId: '123456789',
  email: 'admin@example.com',
  role: 'admin'
};

// Set items in localStorage
localStorage.setItem('authToken', testToken);
localStorage.setItem('user', JSON.stringify(testUser));

console.log('Test token and user set in localStorage');
console.log('Token:', testToken);
console.log('User:', testUser); 