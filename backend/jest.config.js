module.exports = {
  moduleDirectories: ["node_modules", "src"],
  moduleFileExtensions: ["js", "jsx", "json", "node"],
  testEnvironment: "node",  // Use Node environment for backend tests
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest", // Ensures proper transpilation
  }
};
