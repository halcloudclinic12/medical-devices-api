import { startInMemoryMongo, stopInMemoryMongo, clearDatabase } from './mongo';

// Spin up once for the Jest run
beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await startInMemoryMongo();
});

// Clean collections between tests (keeps run time down)
afterEach(async () => {
    await clearDatabase();
});

// Tear down when all tests finish
afterAll(async () => {
    await stopInMemoryMongo();
});
