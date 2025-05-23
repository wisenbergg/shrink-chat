module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@supabase/supabase-js$": "<rootDir>/__mocks__/@supabase/supabase-js.ts",
  },
  setupFiles: ["<rootDir>/jest.setup.js"],
};
