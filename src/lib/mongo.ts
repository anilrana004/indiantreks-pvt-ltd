import { MongoClient, type Db } from 'mongodb';

const globalForMongo = globalThis as unknown as {
  _itMongoClient?: MongoClient;
  _itMongoPromise?: Promise<MongoClient>;
};

function mongoUri(): string {
  return (
    process.env.MONGODB_URI?.trim() ||
    process.env.MONGO_URI?.trim() ||
    process.env.MONGODB_URL?.trim() ||
    ''
  );
}

export function isMongoConfigured(): boolean {
  return Boolean(mongoUri());
}

export function getMongoDbName(): string {
  return process.env.MONGODB_DB?.trim() || process.env.MONGO_DB?.trim() || 'indiantreks';
}

async function getClient(): Promise<MongoClient> {
  const uri = mongoUri();
  if (!uri) {
    throw new Error('MongoDB is not configured. Set MONGODB_URI in .env.local.');
  }

  if (globalForMongo._itMongoClient) return globalForMongo._itMongoClient;

  if (!globalForMongo._itMongoPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 8,
      serverSelectionTimeoutMS: 8_000,
    });
    globalForMongo._itMongoPromise = client.connect().then((connected) => {
      globalForMongo._itMongoClient = connected;
      return connected;
    });
  }

  return globalForMongo._itMongoPromise;
}

export async function getMongoDb(): Promise<Db> {
  const client = await getClient();
  return client.db(getMongoDbName());
}
