/**
 * MongoDB Connection Helper
 * Manages database connection with connection pooling
 */
import { MongoClient, Db } from 'mongodb';

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'constructaid';

// Global variable to store the connection
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

/**
 * Connect to MongoDB with connection pooling
 * Returns cached connection if available
 */
export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  // Return cached connection if available
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Create new connection
  const client = await MongoClient.connect(MONGODB_URI, {
    maxPoolSize: 10, // Maximum number of connections in pool
    minPoolSize: 5,  // Minimum number of connections
    serverSelectionTimeoutMS: 5000, // Timeout for server selection
  });

  const db = client.db(DB_NAME);

  // Cache the connection
  cachedClient = client;
  cachedDb = db;

  console.log('Connected to MongoDB:', DB_NAME);

  return { client, db };
}

/**
 * Initialize database indexes
 * Should be called during application startup
 */
export async function initializeIndexes(): Promise<void> {
  const { db } = await connectToDatabase();

  // Create indexes for Users collection
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('users').createIndex({ role: 1, status: 1 });
  await db.collection('users').createIndex({ 'company.name': 1 });
  await db.collection('users').createIndex({ projects: 1 });

  // Create indexes for Projects collection
  await db.collection('projects').createIndex({ projectNumber: 1 }, { unique: true });
  await db.collection('projects').createIndex({ status: 1 });
  await db.collection('projects').createIndex({ 'team.generalContractor': 1 });
  await db.collection('projects').createIndex({ 'team.owner': 1 });
  await db.collection('projects').createIndex({ 'team.subcontractors.userId': 1 });
  await db.collection('projects').createIndex({ createdAt: -1 });

  // Create indexes for Tasks collection
  await db.collection('tasks').createIndex({ projectId: 1, status: 1 });
  await db.collection('tasks').createIndex({ assignedTo: 1, status: 1 });
  await db.collection('tasks').createIndex({ dueDate: 1 });
  await db.collection('tasks').createIndex({ priority: 1, status: 1 });
  await db.collection('tasks').createIndex({ milestoneId: 1 });
  await db.collection('tasks').createIndex({ createdAt: -1 });

  console.log('Database indexes initialized');
}

/**
 * Close database connection
 * Should be called during application shutdown
 */
export async function closeDatabaseConnection(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    console.log('MongoDB connection closed');
  }
}
