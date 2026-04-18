import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests', '<rootDir>/src'],
    // Make test discovery explicit
    testMatch: [
        '<rootDir>/tests/**/*.(test|spec).ts',
        '<rootDir>/src/**/*.(test|spec).ts',
    ],

    // Force ts-jest to handle TS, nothing else
    transform: {
        '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true }],
    },

    transformIgnorePatterns: ['/node_modules/'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
    moduleNameMapper: {
        '^user/(.*)$': '<rootDir>/src/user/$1',
        '^config/(.*)$': '<rootDir>/src/config/$1',
        '^utils/(.*)$': '<rootDir>/src/utils/$1',
        '^shared/(.*)$': '<rootDir>/src/shared/$1',
        '^auth/(.*)$': '<rootDir>/src/auth/$1',
        '^middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
        '^status/(.*)$': '<rootDir>/src/status/$1',
        '^test/(.*)$': '<rootDir>/src/test/$1',
        '^clinic/(.*)$': '<rootDir>/src/clinic/$1',
        '^customer/(.*)$': '<rootDir>/src/customer/$1',
        '^patient/(.*)$': '<rootDir>/src/patient/$1',
        '^summary/(.*)$': '<rootDir>/src/summary/$1',
    },
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/start.ts'
    ],
};

export default config;
