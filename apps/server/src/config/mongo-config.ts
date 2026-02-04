export interface MongoConfig {
  uri: string;
  dbName: string;
}

export const mongoConfig: MongoConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  dbName: process.env.MONGODB_DB_NAME || 'philosopher',
};
