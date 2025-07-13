module.exports = {
    transform: {
      "^.+\\.[t|j]sx?$": "babel-jest",  // Use babel-jest for all .js and .jsx files
    },
    testEnvironment: "node",  // Use Node environment for backend tests
  };
  