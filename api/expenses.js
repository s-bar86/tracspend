import { MongoClient } from 'mongodb';
import { ObjectId } from 'mongodb';
import { adminAuth } from './firebaseAdmin.js';

// Immediately log that the file is being executed
console.log('API Route Module Loaded - Expenses Endpoint');

// Initialize MongoDB client
const uri = process.env.MONGODB_URI;
console.log('MongoDB URI configuration check:', {
  exists: !!uri,
  length: uri ? uri.length : 0,
  includes_protocol: uri ? uri.startsWith('mongodb') : false
});

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  console.log('Connect to Database function called');
  
  if (cachedClient && cachedDb) {
    console.log('Using cached database connection');
    return { client: cachedClient, db: cachedDb };
  }

  if (!uri) {
    console.error('MONGODB_URI is not defined in environment');
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  try {
    // Log connection attempt with sanitized URI
    const sanitizedUri = uri.replace(/:[^@]*@/, ':****@');
    console.log('Attempting MongoDB connection with URI:', sanitizedUri);
    
    const client = await MongoClient.connect(uri, {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 10000, // Increased timeout
      socketTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    
    const dbName = uri.split('/').pop().split('?')[0] || 'tracspend';
    console.log('Using database:', dbName);
    
    const db = client.db(dbName);
    
    // Test the connection
    await db.command({ ping: 1 });
    console.log('Successfully connected to MongoDB and verified connection');

    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error('MongoDB connection error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    throw error;
  }
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
  // Set response headers first thing
  res.setHeader('Content-Type', 'application/json');
  
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  console.log('Request received:', {
    method: req.method,
    url: req.url,
    query: req.query,
    body: req.body,
    headers: req.headers
  });

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return res.status(200).json({ ok: true });
  }

  try {
    console.log('Attempting database connection...');
    const { db } = await connectToDatabase();
    const expenses = db.collection('expenses');
    console.log('Database connection successful');

    // Secure all endpoints: verify Firebase ID token and get userId (Firebase UID)
    let decoded;
    try {
      decoded = await verifyIdTokenFromHeader(req);
    } catch (err) {
      return res.status(401).json({ success: false, error: err.message });
    }
    const userId = decoded.uid;

    if (req.method === 'GET') {
      try {
        console.log('[DEBUG] GET /api/expenses - userId:', userId);
        // Only fetch expenses for this user
        const query = { userId };
        console.log('[DEBUG] GET /api/expenses - MongoDB query:', query);
        const userExpenses = await expenses.find(query).sort({ date: -1 }).toArray();
        console.log('[DEBUG] GET /api/expenses - Returning count:', userExpenses.length);
        return res.status(200).json({
          success: true,
          count: userExpenses.length,
          data: userExpenses
        });
      } catch (error) {
        console.error('Error in GET request:', {
          name: error.name,
          message: error.message,
          code: error.code,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch expenses',
          message: error.message,
          details: error.code
        });
      }
    }

    if (req.method === 'POST') {
      try {
        console.log('Handling POST request:', req.body);
        try {
          console.log('[DEBUG] POST /api/expenses - Incoming body:', req.body);
          console.log('[DEBUG] POST /api/expenses - Headers:', req.headers);
          // Validate request body
          if (!req.body || !req.body.amount || !req.body.tag) {
            console.error('[DEBUG] POST /api/expenses - Missing required fields', req.body);
            return res.status(400).json({
              success: false,
              error: 'Missing required fields',
              details: { 
                received: req.body,
                required: ['amount', 'tag']
              }
            });
          }

          // Create new expense document
          const newExpense = {
            ...req.body,
            userId, // Always associate with Firebase UID
            amount: parseFloat(req.body.amount),
            date: new Date().toISOString(),
            createdAt: new Date()
          };

          try {
            const result = await expenses.insertOne(newExpense);
            console.log('[DEBUG] POST /api/expenses - Successfully added expense:', {
              insertedId: result.insertedId,
              userId: newExpense.userId,
              expense: newExpense
            });
            // Return success response
            return res.status(201).json({
              success: true,
              data: { ...newExpense, _id: result.insertedId }
            });
          } catch (dbErr) {
            console.error('[DEBUG] POST /api/expenses - MongoDB insert error:', dbErr);
            throw dbErr;
          }
        } catch (error) {
          console.error('[DEBUG] POST /api/expenses - Error in POST handler:', error);
          return res.status(500).json({
            success: false,
            error: 'Failed to add expense',
            message: error.message,
            details: error.code
          });
        }
      } catch (error) {
        console.error('Error in POST request:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to add expense',
          message: error.message,
          details: error.code
        });
      }
    }

    if (req.method === 'PUT') {
      try {
        console.log('[DEBUG] PUT /api/expenses - Incoming body:', req.body);
        // Validate request body
        if (!req.body || !req.body.id) {
          return res.status(400).json({
            success: false,
            error: 'Missing expense ID'
          });
        }

        const { id, ...updateData } = req.body;
        console.log('[DEBUG] PUT /api/expenses - id:', id, 'userId:', userId, 'updateData:', updateData);
        // Convert amount to number if present
        if (updateData.amount) {
          updateData.amount = parseFloat(updateData.amount);
        }
        // Add update timestamp
        updateData.updatedAt = new Date();
        // Only update if expense belongs to this user
        const result = await expenses.findOneAndUpdate(
          { _id: new ObjectId(id), userId },
          { $set: updateData },
          { returnDocument: 'after' }
        );
        console.log('[DEBUG] PUT /api/expenses - MongoDB update result:', result);
        if (!result || !result.value) {
          return res.status(404).json({
            success: false,
            error: 'Expense not found or not authorized'
          });
        }
        // Return success response
        return res.status(200).json({
          success: true,
          data: result.value
        });

      } catch (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update expense'
        });
      }
    }

    if (req.method === 'DELETE') {
      try {
        const id = req.query.id;
        if (!id) {
          return res.status(400).json({
            success: false,
            error: 'Missing expense ID'
          });
        }

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid expense ID format'
          });
        }

        // Only delete if expense belongs to this user
        const result = await expenses.findOneAndDelete({ _id: new ObjectId(id), userId });
        if (!result) {
          return res.status(404).json({
            success: false,
            error: 'Expense not found or not authorized'
          });
        }
        // Return success response with the deleted document
        return res.status(200).json({
          success: true,
          data: result
        });

      } catch (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to delete expense'
        });
      }
    }
    
    // If we reach here, method is not supported
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ 
      success: false,
      error: `Method ${req.method} Not Allowed` 
    });
    
  } catch (error) {
    console.error('Fatal error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      code: error.code || 'UNKNOWN'
    });
  }
} 