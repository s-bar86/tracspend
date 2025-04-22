// /api/expenses/reset.js
import { adminAuth } from '../firebaseAdmin.js';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }
  const client = await MongoClient.connect(uri, {
    maxPoolSize: 1,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });
  const dbName = uri.split('/').pop().split('?')[0] || 'tracspend';
  const db = client.db(dbName);
  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

async function verifyIdTokenFromHeader(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }
  const idToken = authHeader.replace('Bearer ', '').trim();
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    return decoded;
  } catch (err) {
    throw new Error('Invalid or expired token');
  }
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const decoded = await verifyIdTokenFromHeader(req);
    const userId = decoded.uid;
    const { db } = await connectToDatabase();
    const expenses = db.collection('expenses');
    const result = await expenses.deleteMany({ userId });
    return res.status(200).json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    return res.status(401).json({ success: false, error: err.message });
  }
}
