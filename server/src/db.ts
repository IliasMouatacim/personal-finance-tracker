import { MongoClient } from 'mongodb';

let client: MongoClient;
let isConnected = false;

async function connectDB() {
  if (isConnected) return client.db("finance-tracker");

  try {
    let uri = process.env.MONGODB_URI;

    if (!uri) {
      console.log("No MONGODB_URI found, starting in-memory mongodb-memory-server...");
      // Dynamically import to avoid requiring it in production if not needed
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      console.log(`Started in-memory MongoDB at ${uri}`);
    }

    client = new MongoClient(uri);
    await client.connect();
    isConnected = true;
    console.log("Connected to MongoDB");
    return client.db("finance-tracker");
  } catch (error) {
    console.error("Error connecting to MongoDB", error);
    process.exit(1);
  }
}

export default connectDB;
