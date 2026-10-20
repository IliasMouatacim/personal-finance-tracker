import { Db, MongoClient } from "mongodb";

let connection: Promise<Db> | undefined;
async function openDatabase(): Promise<Db> {
  let uri = process.env.MONGODB_URI;
  if (!uri) {
    if (process.env.NODE_ENV === "production")
      throw new Error("DATABASE_NOT_CONFIGURED");
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
  }
  const client = new MongoClient(uri, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 10_000,
  });
  try {
    await client.connect();
    const db = client.db("finance-tracker");
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("transactions").createIndex({ userId: 1, date: -1 });
    return db;
  } catch (error) {
    await client.close();
    throw error;
  }
}
export default function connectDB(): Promise<Db> {
  if (!connection)
    connection = openDatabase().catch((error) => {
      connection = undefined;
      throw error;
    });
  return connection;
}
