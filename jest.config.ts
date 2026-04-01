import type { Config } from "jest";

const tsJestOptions = {
  tsconfig: {
    rootDir: ".",
    moduleResolution: "bundler",
    module: "esnext",
    jsx: "react-jsx",
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    noEmit: true,
    ignoreDeprecations: "6.0",
    paths: { "@/*": ["./*"] },
  },
};

const config: Config = {
  projects: [
    {
      displayName: "api",
      testEnvironment: "node",
      testMatch: ["<rootDir>/__tests__/api/**/*.test.ts", "<rootDir>/__tests__/lib/**/*.test.ts"],
      moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
      transform: { "^.+\\.tsx?$": ["ts-jest", tsJestOptions] },
    },
    {
      displayName: "ui",
      testEnvironment: "jsdom",
      testMatch: ["<rootDir>/__tests__/components/**/*.test.tsx", "<rootDir>/__tests__/pages/**/*.test.tsx"],
      moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
      transform: { "^.+\\.tsx?$": ["ts-jest", tsJestOptions] },
      setupFilesAfterEnv: ["@testing-library/jest-dom"],
    },
  ],
  testTimeout: 10000,
};

export default config;
