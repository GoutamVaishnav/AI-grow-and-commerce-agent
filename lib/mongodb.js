import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB || "shopagent_ai";

if (!uri) {
  // The error is intentionally delayed until an auth route is used. That lets
  // the catalog demo keep rendering while the developer configures MongoDB.
  console.warn("MONGODB_URI is not configured. Authentication is unavailable until it is set.");
}

let clientPromise;

function getClientPromise() {
  if (!uri) throw new Error("MONGODB_URI is required for authentication.");

  if (process.env.NODE_ENV === "development") {
    if (!global._shopAgentMongoClientPromise) {
      const client = new MongoClient(uri);
      global._shopAgentMongoClientPromise = client.connect();
    }
    return global._shopAgentMongoClientPromise;
  }

  if (!clientPromise) {
    const client = new MongoClient(uri);
    clientPromise = client.connect();
  }
  return clientPromise;
}

let usersIndexPromise;

export async function getDatabase() {
  const client = await getClientPromise();
  return client.db(databaseName);
}

export async function getUsersCollection() {
  const users = (await getDatabase()).collection("users");
  if (!usersIndexPromise) {
    usersIndexPromise = users.createIndex({ email: 1 }, { unique: true, name: "unique_user_email" });
  }
  await usersIndexPromise;
  return users;
}
