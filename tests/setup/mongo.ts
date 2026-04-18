import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer | null = null;

export async function startInMemoryMongo() {
    mongod = await MongoMemoryServer.create({
        // you can pin version in CI if needed: binary: { version: '7.0.14' }
    });
    const uri = mongod.getUri();
    await mongoose.connect(uri, { dbName: 'testdb' });
}

export async function stopInMemoryMongo() {
    await mongoose.connection.dropDatabase().catch(() => { });
    await mongoose.connection.close().catch(() => { });
    if (mongod) {
        await mongod.stop();
        mongod = null;
    }
}

export async function clearDatabase() {
    const { collections } = mongoose.connection;
    for (const key of Object.keys(collections)) {
        await collections[key].deleteMany({});
    }
}
