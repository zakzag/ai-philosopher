import { MongoClient, Db } from 'mongodb';
import { mongoConfig } from '../config/index.js';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToMongo(): Promise<Db> {
  if (db) return db;

  client = new MongoClient(mongoConfig.uri);
  await client.connect();
  db = client.db(mongoConfig.dbName);

  console.log(`Connected to MongoDB: ${mongoConfig.dbName}`);

  // Create indexes (non-blocking, will log errors but not fail startup)
  try {
    await db.collection('debates').createIndex({ createdAt: -1 });
    await db.collection('messages').createIndex({ debateId: 1, timestamp: 1 });
    console.log('Database indexes created');
  } catch (error) {
    console.warn('Could not create indexes (this is OK if they already exist):', error);
  }

  return db;
}

export function getDb(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectToMongo() first.');
  }
  return db;
}

export async function closeConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
